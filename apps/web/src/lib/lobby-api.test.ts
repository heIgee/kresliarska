import { describe, expect, it } from "vitest";
import { parseLobbyCode } from "./lobby-api";

describe("parseLobbyCode", () => {
  it("accepts a bare code or a pasted link", () => {
    expect(parseLobbyCode(" k3Xa9Qpz ")).toBe("k3Xa9Qpz");
    expect(parseLobbyCode("http://localhost:5175/l/k3Xa9Qpz")).toBe("k3Xa9Qpz");
    expect(parseLobbyCode("https://example.com/l/k3Xa9Qpz/")).toBe("k3Xa9Qpz");
  });

  it("rejects malformed input", () => {
    expect(parseLobbyCode("")).toBeUndefined();
    expect(parseLobbyCode("short")).toBeUndefined();
    expect(parseLobbyCode("https://example.com/l/bad!code")).toBeUndefined();
  });
});
