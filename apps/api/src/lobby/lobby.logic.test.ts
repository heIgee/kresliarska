import { LOBBY_MAX_MEMBERS, lobbyIdSchema, type Member } from "@kresliarska/shared";
import { describe, expect, it } from "vitest";
import {
  addMemberSocket,
  generateLobbyId,
  type LobbyMembers,
  listMembers,
  removeMemberSocket,
} from "./lobby.logic.js";

const memberFor = (index: number): Member => ({
  clientId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  name: `Member ${index}`,
  color: "#16a34a",
});

describe("generateLobbyId", () => {
  it("produces a valid lobby id", () => {
    expect(lobbyIdSchema.safeParse(generateLobbyId()).success).toBe(true);
  });

  it("skips bytes that would bias the alphabet", () => {
    const id = generateLobbyId((size) => new Uint8Array(size).fill(1).fill(255, 0, 8));
    expect(id).toBe("11111111");
  });
});

describe("member sockets", () => {
  it("keeps one member per clientId across sockets", () => {
    const members: LobbyMembers<string> = new Map();
    addMemberSocket(members, memberFor(1), "tab-a");
    addMemberSocket(members, memberFor(1), "tab-b");
    expect(listMembers(members)).toHaveLength(1);

    expect(removeMemberSocket(members, memberFor(1).clientId, "tab-a")).toBe(false);
    expect(removeMemberSocket(members, memberFor(1).clientId, "tab-b")).toBe(true);
    expect(members.size).toBe(0);
  });

  it("rejects new members past the cap but lets existing ones add sockets", () => {
    const members: LobbyMembers<string> = new Map();
    for (let index = 0; index < LOBBY_MAX_MEMBERS; index += 1) {
      expect(addMemberSocket(members, memberFor(index), `socket-${index}`)).toBe("joined");
    }
    expect(addMemberSocket(members, memberFor(LOBBY_MAX_MEMBERS), "late")).toBe("full");
    expect(addMemberSocket(members, memberFor(0), "second-tab")).toBe("joined");
  });
});
