import { describe, expect, it } from "vitest";
import { parseHealthResponse } from "./index.js";

describe("parseHealthResponse", () => {
  it("accepts an ok payload", () => {
    expect(parseHealthResponse({ ok: true })).toEqual({ ok: true });
  });

  it("rejects a non-ok payload", () => {
    expect(() => parseHealthResponse({ ok: false })).toThrow();
  });
});
