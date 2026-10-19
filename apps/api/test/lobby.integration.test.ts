import "reflect-metadata";
import type { AddressInfo } from "node:net";
import {
  LOBBY_CLOSE_CODES,
  LOBBY_MAX_MEMBERS,
  LOBBY_WS_ROUTE,
  type LobbyServerMessage,
  lobbyServerMessageSchema,
  type Member,
} from "@kresliarska/shared";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { createHttpTestApp } from "./http-test-app.js";

type TestClient = {
  socket: WebSocket;
  nextMessage: () => Promise<LobbyServerMessage>;
  closed: Promise<number>;
};

const isAddressInfo = (value: unknown): value is AddressInfo =>
  typeof value === "object" && value !== null && "port" in value;

const memberFor = (index: number): Member => ({
  clientId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  name: `Member ${index}`,
  color: "#16a34a",
});

describe("Lobby HTTP + WebSocket", () => {
  let app: INestApplication;
  let wsUrl: string;
  const clients: WebSocket[] = [];

  const connect = async (): Promise<TestClient> => {
    const socket = new WebSocket(wsUrl);
    clients.push(socket);
    const queue: LobbyServerMessage[] = [];
    const waiters: Array<(message: LobbyServerMessage) => void> = [];
    socket.on("message", (raw) => {
      const message = lobbyServerMessageSchema.parse(JSON.parse(raw.toString()));
      const waiter = waiters.shift();
      if (waiter) {
        waiter(message);
        return;
      }
      queue.push(message);
    });
    const closed = new Promise<number>((resolve) => {
      socket.on("close", (code) => resolve(code));
    });
    await new Promise<void>((resolve, reject) => {
      socket.once("open", () => resolve());
      socket.once("error", reject);
    });
    const nextMessage = (): Promise<LobbyServerMessage> => {
      const queued = queue.shift();
      if (queued) {
        return Promise.resolve(queued);
      }
      return new Promise((resolve) => waiters.push(resolve));
    };
    return { socket, nextMessage, closed };
  };

  const join = async (lobbyId: string, member: Member): Promise<TestClient> => {
    const client = await connect();
    client.socket.send(JSON.stringify({ type: "join", lobbyId, member }));
    return client;
  };

  const createLobby = async (): Promise<string> => {
    const response = await request(app.getHttpServer()).post("/api/lobbies").expect(201);
    return response.body.id;
  };

  const namesOf = (message: LobbyServerMessage): string[] =>
    message.members.map((member) => member.name);

  beforeEach(async () => {
    app = await createHttpTestApp({ port: 0 });
    await app.listen(0, "127.0.0.1");
    const address: unknown = app.getHttpServer().address();
    if (!isAddressInfo(address)) {
      throw new Error("Test server is not listening on a TCP port");
    }
    wsUrl = `ws://127.0.0.1:${address.port}${LOBBY_WS_ROUTE}`;
  });

  afterEach(async () => {
    for (const socket of clients.splice(0)) {
      socket.terminate();
    }
    await app.close();
  });

  it("creates a lobby and resolves it by id; unknown ids 404", async () => {
    const id = await createLobby();
    await request(app.getHttpServer()).get(`/api/lobbies/${id}`).expect(200, { id });
    await request(app.getHttpServer()).get("/api/lobbies/zzzzzzzz").expect(404);
    await request(app.getHttpServer()).get("/api/lobbies/bad").expect(404);
  });

  it("broadcasts presence on join and leave", async () => {
    const id = await createLobby();
    const first = await join(id, memberFor(1));
    expect(namesOf(await first.nextMessage())).toEqual(["Member 1"]);

    const second = await join(id, memberFor(2));
    expect(namesOf(await second.nextMessage())).toEqual(["Member 1", "Member 2"]);
    expect(namesOf(await first.nextMessage())).toEqual(["Member 1", "Member 2"]);

    second.socket.close();
    expect(namesOf(await first.nextMessage())).toEqual(["Member 1"]);
  });

  it("lists two tabs of the same client once", async () => {
    const id = await createLobby();
    const tabA = await join(id, memberFor(1));
    await tabA.nextMessage();
    const tabB = await join(id, memberFor(1));
    expect(namesOf(await tabB.nextMessage())).toEqual(["Member 1"]);
    expect(namesOf(await tabA.nextMessage())).toEqual(["Member 1"]);

    tabB.socket.close();
    expect(namesOf(await tabA.nextMessage())).toEqual(["Member 1"]);
  });

  it("closes with 4404 for unknown lobbies and 4400 for invalid messages", async () => {
    const unknown = await join("zzzzzzzz", memberFor(1));
    expect(await unknown.closed).toBe(LOBBY_CLOSE_CODES.notFound);

    const invalid = await connect();
    invalid.socket.send("not json");
    expect(await invalid.closed).toBe(LOBBY_CLOSE_CODES.invalid);
  });

  it("closes with 4409 when the lobby is full", async () => {
    const id = await createLobby();
    for (let index = 0; index < LOBBY_MAX_MEMBERS; index += 1) {
      const client = await join(id, memberFor(index));
      await client.nextMessage();
    }
    const late = await join(id, memberFor(LOBBY_MAX_MEMBERS));
    expect(await late.closed).toBe(LOBBY_CLOSE_CODES.full);
  });
});
