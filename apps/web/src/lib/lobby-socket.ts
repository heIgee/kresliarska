import {
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
  member: Member;
  onStatus: (status: LobbyConnectionStatus) => void;
  onMembers: (members: Member[]) => void;
};

/** Opens the lobby socket and keeps it alive; returns a disposer. */
export const connectLobby = ({
  lobbyId,
  member,
  onStatus,
  onMembers,
}: ConnectLobbyOptions): (() => void) => {
  let socket: WebSocket | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;
  let disposed = false;

  const open = (): void => {
    socket = new WebSocket(lobbyWsUrl());

    socket.addEventListener("open", () => {
      const join: LobbyClientMessage = { type: "join", lobbyId, member };
      socket?.send(JSON.stringify(join));
    });

    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") {
        return;
      }
      const message = parseServerMessage(event.data);
      if (!message) {
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

  return () => {
    disposed = true;
    clearTimeout(reconnectTimer);
    socket?.close();
  };
};
