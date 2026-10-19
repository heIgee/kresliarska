import {
  type Cursor,
  LOBBY_CLOSE_CODES,
  LOBBY_WS_ROUTE,
  type LobbyClientMessage,
  type LobbyServerMessage,
  lobbyServerMessageSchema,
  type Member,
} from "@kresliarska/shared";

export type LobbyConnectionStatus =
  | "connecting"
  | "live"
  | "reconnecting"
  | "not_found"
  | "full"
  | "invalid";

type TerminalStatus = Extract<LobbyConnectionStatus, "not_found" | "full" | "invalid">;

const BASE_RECONNECT_DELAY_MS = 500;
const MAX_RECONNECT_DELAY_MS = 8_000;

export const terminalStatusForCloseCode = (code: number): TerminalStatus | undefined => {
  switch (code) {
    case LOBBY_CLOSE_CODES.notFound:
      return "not_found";
    case LOBBY_CLOSE_CODES.full:
      return "full";
    case LOBBY_CLOSE_CODES.invalid:
      return "invalid";
    default:
      return undefined;
  }
};

export const reconnectDelayMs = (attempt: number): number =>
  Math.min(BASE_RECONNECT_DELAY_MS * 2 ** attempt, MAX_RECONNECT_DELAY_MS);

const parseServerMessage = (data: string): LobbyServerMessage | undefined => {
  try {
    const parsed = lobbyServerMessageSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
};

const lobbyWsUrl = (): string => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${LOBBY_WS_ROUTE}`;
};

type ConnectLobbyOptions = {
  lobbyId: string;
  /** Read on every (re)connect so a rename survives reconnects. */
  getMember: () => Member;
  onStatus: (status: LobbyConnectionStatus) => void;
  onMembers: (members: Member[]) => void;
  onCursor: (clientId: string, cursor: Cursor | null) => void;
};

export type LobbyConnection = {
  /** Dropped while disconnected; the join on reconnect carries the latest identity. */
  send: (message: LobbyClientMessage) => void;
  dispose: () => void;
};

/** Opens the lobby socket and keeps it alive. */
export const connectLobby = ({
  lobbyId,
  getMember,
  onStatus,
  onMembers,
  onCursor,
}: ConnectLobbyOptions): LobbyConnection => {
  let socket: WebSocket | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;
  let disposed = false;

  const send = (message: LobbyClientMessage): void => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const open = (): void => {
    socket = new WebSocket(lobbyWsUrl());

    socket.addEventListener("open", () => {
      send({ type: "join", lobbyId, member: getMember() });
    });

    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") {
        return;
      }
      const message = parseServerMessage(event.data);
      if (!message) {
        return;
      }
      if (message.type === "cursor") {
        onCursor(message.clientId, message.cursor);
        return;
      }
      attempt = 0;
      onStatus("live");
      onMembers(message.members);
    });

    socket.addEventListener("close", (event) => {
      if (disposed) {
        return;
      }
      const terminal = terminalStatusForCloseCode(event.code);
      if (terminal) {
        onStatus(terminal);
        return;
      }
      onStatus("reconnecting");
      reconnectTimer = setTimeout(open, reconnectDelayMs(attempt));
      attempt += 1;
    });
  };

  onStatus("connecting");
  open();

  return {
    send,
    dispose: () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    },
  };
};
