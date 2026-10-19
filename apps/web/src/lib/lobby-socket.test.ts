import { LOBBY_CLOSE_CODES } from "@kresliarska/shared";
import { describe, expect, it } from "vitest";
import { reconnectDelayMs, terminalStatusForCloseCode } from "./lobby-socket";

describe("terminalStatusForCloseCode", () => {
  it("stops reconnecting on lobby close codes", () => {
    expect(terminalStatusForCloseCode(LOBBY_CLOSE_CODES.notFound)).toBe("not_found");
    expect(terminalStatusForCloseCode(LOBBY_CLOSE_CODES.full)).toBe("full");
    expect(terminalStatusForCloseCode(LOBBY_CLOSE_CODES.invalid)).toBe("invalid");
  });

  it("keeps reconnecting on network-level closes", () => {
    expect(terminalStatusForCloseCode(1006)).toBeUndefined();
    expect(terminalStatusForCloseCode(1001)).toBeUndefined();
  });
});

describe("reconnectDelayMs", () => {
  it("backs off exponentially up to a cap", () => {
    expect(reconnectDelayMs(0)).toBe(500);
    expect(reconnectDelayMs(1)).toBe(1_000);
    expect(reconnectDelayMs(10)).toBe(8_000);
  });
});
