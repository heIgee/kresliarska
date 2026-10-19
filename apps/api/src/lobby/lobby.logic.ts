import { randomBytes } from "node:crypto";
import { LOBBY_ID_LENGTH, LOBBY_MAX_MEMBERS, type Member } from "@kresliarska/shared";

export const LOBBY_EMPTY_TTL_MS = 5 * 60_000;

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
// Largest multiple of 62 that fits in a byte; higher bytes are rejected to avoid modulo bias.
const UNBIASED_BYTE_LIMIT = 248;

type MemberEntry<S> = { member: Member; sockets: Set<S> };
export type LobbyMembers<S> = Map<string, MemberEntry<S>>;

export const generateLobbyId = (readBytes: (size: number) => Uint8Array = randomBytes): string => {
  let id = "";
  while (id.length < LOBBY_ID_LENGTH) {
    for (const byte of readBytes(LOBBY_ID_LENGTH * 2)) {
      if (byte < UNBIASED_BYTE_LIMIT && id.length < LOBBY_ID_LENGTH) {
        id += BASE62[byte % BASE62.length];
      }
    }
  }
  return id;
};

/** One entry per clientId: a second tab or a reconnect attaches its socket to the existing member. */
export const addMemberSocket = <S>(
  members: LobbyMembers<S>,
  member: Member,
  socket: S,
): "joined" | "full" => {
  const existing = members.get(member.clientId);
  if (existing) {
    existing.member = member;
    existing.sockets.add(socket);
    return "joined";
  }
  if (members.size >= LOBBY_MAX_MEMBERS) {
    return "full";
  }
  members.set(member.clientId, { member, sockets: new Set([socket]) });
  return "joined";
};

/** Returns true when the member left entirely (their last socket closed). */
export const removeMemberSocket = <S>(
  members: LobbyMembers<S>,
  clientId: string,
  socket: S,
): boolean => {
  const entry = members.get(clientId);
  if (!entry) {
    return false;
  }
  entry.sockets.delete(socket);
  if (entry.sockets.size > 0) {
    return false;
  }
  members.delete(clientId);
  return true;
};

export type RateWindow = { startedAt: number; count: number };

/** Fixed-window limiter: returns whether this event fits, plus the next window state. */
export const consumeRate = (
  window: RateWindow | undefined,
  now: number,
  limit: { max: number; windowMs: number },
): { allowed: boolean; window: RateWindow } => {
  if (!window || now - window.startedAt >= limit.windowMs) {
    return { allowed: true, window: { startedAt: now, count: 1 } };
  }
  if (window.count >= limit.max) {
    return { allowed: false, window };
  }
  return { allowed: true, window: { startedAt: window.startedAt, count: window.count + 1 } };
};

export const listMembers = <S>(members: LobbyMembers<S>): Member[] =>
  Array.from(members.values(), (entry) => entry.member);
