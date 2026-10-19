import {
  CURSOR_RATE_LIMIT,
  LOBBY_CLOSE_CODES,
  LOBBY_WS_ROUTE,
  lobbyClientMessageSchema,
  type Member,
} from "@kresliarska/shared";
import { type OnModuleDestroy } from "@nestjs/common";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  WebSocketGateway,
} from "@nestjs/websockets";
import WebSocket, { type RawData, type WebSocketServer } from "ws";
import { consumeRate, type RateWindow } from "./lobby.logic.js";
import { LobbyService } from "./lobby.service.js";

const HEARTBEAT_INTERVAL_MS = 30_000;

type Session = { lobbyId: string; clientId: string };

const parseJson = (raw: RawData): unknown => {
  try {
    return JSON.parse(raw.toString());
  } catch {
    return undefined;
  }
};

const closeInvalid = (client: WebSocket): void => {
  client.close(LOBBY_CLOSE_CODES.invalid, "Invalid message");
};

@WebSocketGateway({ path: LOBBY_WS_ROUTE })
export class LobbyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly sessions = new WeakMap<WebSocket, Session>();
  private readonly alive = new WeakSet<WebSocket>();
  private readonly cursorWindows = new WeakMap<WebSocket, RateWindow>();
  private heartbeat: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly lobbyService: LobbyService) {}

  afterInit(server: WebSocketServer): void {
    this.heartbeat = setInterval(() => {
      for (const client of server.clients) {
        if (!this.alive.has(client)) {
          client.terminate();
          continue;
        }
        this.alive.delete(client);
        client.ping();
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  handleConnection(client: WebSocket): void {
    this.alive.add(client);
    client.on("pong", () => {
      this.alive.add(client);
    });
    client.on("message", (raw) => {
      this.handleMessage(client, raw);
    });
  }

  handleDisconnect(client: WebSocket): void {
    const session = this.sessions.get(client);
    if (!session) {
      return;
    }
    this.sessions.delete(client);
    this.lobbyService.leave(session.lobbyId, session.clientId, client);
    this.lobbyService.broadcastPresence(session.lobbyId);
  }

  onModuleDestroy(): void {
    clearInterval(this.heartbeat);
  }

  private handleMessage(client: WebSocket, raw: RawData): void {
    const parsed = lobbyClientMessageSchema.safeParse(parseJson(raw));
    const session = this.sessions.get(client);
    if (!parsed.success) {
      closeInvalid(client);
      return;
    }

    const message = parsed.data;
    if (message.type === "join") {
      if (session) {
        closeInvalid(client);
        return;
      }
      this.handleJoin(client, message.lobbyId, message.member);
      return;
    }
    if (!session) {
      closeInvalid(client);
      return;
    }

    switch (message.type) {
      case "cursor": {
        const rate = consumeRate(this.cursorWindows.get(client), Date.now(), CURSOR_RATE_LIMIT);
        this.cursorWindows.set(client, rate.window);
        const allowed = rate.allowed;
        if (allowed) {
          this.lobbyService.relayFrom(session.lobbyId, session.clientId, {
            type: "cursor",
            clientId: session.clientId,
            cursor: message.cursor,
          });
        }
        return;
      }
      case "rename":
        this.lobbyService.rename(session.lobbyId, session.clientId, message.profile);
        this.lobbyService.broadcastPresence(session.lobbyId);
        return;
    }
  }

  private handleJoin(client: WebSocket, lobbyId: string, member: Member): void {
    const result = this.lobbyService.join(lobbyId, member, client);
    if (result === "not_found") {
      client.close(LOBBY_CLOSE_CODES.notFound, "Lobby not found");
      return;
    }
    if (result === "full") {
      client.close(LOBBY_CLOSE_CODES.full, "Lobby is full");
      return;
    }

    this.sessions.set(client, { lobbyId, clientId: member.clientId });
    this.lobbyService.broadcastPresence(lobbyId);
  }
}
