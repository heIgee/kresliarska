import { type LobbyServerMessage, type Member } from "@kresliarska/shared";
import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import {
  addMemberSocket,
  generateLobbyId,
  LOBBY_EMPTY_TTL_MS,
  type LobbyMembers,
  listMembers,
  removeMemberSocket,
} from "./lobby.logic.js";

export type LobbySocket = { send: (data: string) => void };

type Lobby = {
  members: LobbyMembers<LobbySocket>;
  emptyTimer: ReturnType<typeof setTimeout> | undefined;
};

@Injectable()
export class LobbyService implements OnModuleDestroy {
  private readonly lobbies = new Map<string, Lobby>();

  create(): string {
    let id = generateLobbyId();
    while (this.lobbies.has(id)) {
      id = generateLobbyId();
    }
    const lobby: Lobby = { members: new Map(), emptyTimer: undefined };
    this.lobbies.set(id, lobby);
    this.scheduleEmptyCleanup(id, lobby);
    return id;
  }

  exists(id: string): boolean {
    return this.lobbies.has(id);
  }

  join(lobbyId: string, member: Member, socket: LobbySocket): "joined" | "not_found" | "full" {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      return "not_found";
    }
    const result = addMemberSocket(lobby.members, member, socket);
    if (result === "joined") {
      clearTimeout(lobby.emptyTimer);
      lobby.emptyTimer = undefined;
    }
    return result;
  }

  leave(lobbyId: string, clientId: string, socket: LobbySocket): void {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      return;
    }
    removeMemberSocket(lobby.members, clientId, socket);
    if (lobby.members.size === 0) {
      this.scheduleEmptyCleanup(lobbyId, lobby);
    }
  }

  broadcastPresence(lobbyId: string): void {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      return;
    }
    const message: LobbyServerMessage = { type: "presence", members: listMembers(lobby.members) };
    const payload = JSON.stringify(message);
    for (const entry of lobby.members.values()) {
      for (const socket of entry.sockets) {
        socket.send(payload);
      }
    }
  }

  onModuleDestroy(): void {
    for (const lobby of this.lobbies.values()) {
      clearTimeout(lobby.emptyTimer);
    }
    this.lobbies.clear();
  }

  private scheduleEmptyCleanup(id: string, lobby: Lobby): void {
    clearTimeout(lobby.emptyTimer);
    lobby.emptyTimer = setTimeout(() => {
      this.lobbies.delete(id);
    }, LOBBY_EMPTY_TTL_MS);
  }
}
