import { describe, expect, it } from "vitest";
import { generateIdentity, IDENTITY_COLORS } from "./identity.js";
import { lobbyClientMessageSchema, lobbyIdSchema, memberSchema } from "./lobby.js";

const member = {
  clientId: "6f1c2a1e-3b4d-4c5e-8f90-1a2b3c4d5e6f",
  name: "Brave Otter",
  color: "#16a34a",
};

describe("lobbyIdSchema", () => {
  it("accepts 8-char base62", () => {
    expect(lobbyIdSchema.safeParse("k3Xa9Qpz").success).toBe(true);
  });

  it("rejects wrong length or symbols", () => {
    expect(lobbyIdSchema.safeParse("k3Xa9Qp").success).toBe(false);
    expect(lobbyIdSchema.safeParse("k3Xa9Qp!").success).toBe(false);
  });
});

describe("memberSchema", () => {
  it("rejects blank names and non-hex colors", () => {
    expect(memberSchema.safeParse({ ...member, name: "  " }).success).toBe(false);
    expect(memberSchema.safeParse({ ...member, color: "red" }).success).toBe(false);
  });
});

describe("lobbyClientMessageSchema", () => {
  it("parses a join message", () => {
    const message = { type: "join", lobbyId: "k3Xa9Qpz", member };
    expect(lobbyClientMessageSchema.parse(message)).toEqual(message);
  });

  it("parses cursor updates, including leaving the canvas", () => {
    const cursor = { x: 10.5, y: -3, tool: "pointer", button: "up" };
    expect(lobbyClientMessageSchema.parse({ type: "cursor", cursor })).toEqual({
      type: "cursor",
      cursor,
    });
    expect(lobbyClientMessageSchema.parse({ type: "cursor", cursor: null }).type).toBe("cursor");
  });

  it("rejects non-finite cursor coordinates", () => {
    const cursor = { x: Number.POSITIVE_INFINITY, y: 0, tool: "pointer", button: "up" };
    expect(lobbyClientMessageSchema.safeParse({ type: "cursor", cursor }).success).toBe(false);
  });

  it("parses a rename with a valid profile only", () => {
    const profile = { name: "Calm Seal", color: "#0284c7" };
    expect(lobbyClientMessageSchema.safeParse({ type: "rename", profile }).success).toBe(true);
    expect(
      lobbyClientMessageSchema.safeParse({ type: "rename", profile: { ...profile, name: "" } })
        .success,
    ).toBe(false);
  });

  it("rejects unknown message types", () => {
    expect(lobbyClientMessageSchema.safeParse({ type: "leave" }).success).toBe(false);
  });
});

describe("generateIdentity", () => {
  it("is deterministic for a given random source", () => {
    expect(generateIdentity(() => 0)).toEqual({ name: "Brave Badger", color: IDENTITY_COLORS[0] });
  });

  it("produces a member-valid name and color", () => {
    const identity = generateIdentity(() => 0.999);
    expect(memberSchema.safeParse({ ...member, ...identity }).success).toBe(true);
  });
});
