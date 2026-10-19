import { LOBBY_CLOSE_CODES, LOBBY_WS_ROUTE, lobbyClientMessageSchema } from "@kresliarska/shared";
import { type OnModuleDestroy } from "@nestjs/common";
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  WebSocketGateway,
} from "@nestjs/websockets";
import WebSocket, { type RawData, type WebSocketServer } from "ws";
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

@WebSocketGateway({ path: LOBBY_WS_ROUTE })
export class LobbyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly sessions = new WeakMap<WebSocket, Session>();
  private readonly alive = new WeakSet<WebSocket>();
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
    if (!parsed.success || this.sessions.has(client)) {
      client.close(LOBBY_CLOSE_CODES.invalid, "Invalid message");
      return;
    }

    const { lobbyId, member } = parsed.data;
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
