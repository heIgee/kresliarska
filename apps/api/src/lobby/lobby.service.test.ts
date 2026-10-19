import type { Member } from "@kresliarska/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOBBY_EMPTY_TTL_MS } from "./lobby.logic.js";
import { LobbyService } from "./lobby.service.js";

const member: Member = {
  clientId: "6f1c2a1e-3b4d-4c5e-8f90-1a2b3c4d5e6f",
  name: "Brave Otter",
  color: "#16a34a",
};

describe("LobbyService empty-lobby TTL", () => {
  let service: LobbyService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new LobbyService();
  });

  afterEach(() => {
    service.onModuleDestroy();
    vi.useRealTimers();
  });

  it("deletes a lobby nobody joined after the TTL", () => {
    const id = service.create();
    vi.advanceTimersByTime(LOBBY_EMPTY_TTL_MS - 1);
    expect(service.exists(id)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(service.exists(id)).toBe(false);
  });

  it("keeps an occupied lobby and restarts the TTL when the last member leaves", () => {
    const id = service.create();
    const socket = { send: vi.fn() };
    expect(service.join(id, member, socket)).toBe("joined");

    vi.advanceTimersByTime(LOBBY_EMPTY_TTL_MS * 2);
    expect(service.exists(id)).toBe(true);

    service.leave(id, member.clientId, socket);
    vi.advanceTimersByTime(LOBBY_EMPTY_TTL_MS - 1);
    expect(service.exists(id)).toBe(true);

    expect(service.join(id, member, socket)).toBe("joined");
    vi.advanceTimersByTime(LOBBY_EMPTY_TTL_MS);
    expect(service.exists(id)).toBe(true);
  });

  it("reports unknown lobbies", () => {
    expect(service.join("missing0", member, { send: vi.fn() })).toBe("not_found");
  });
});
