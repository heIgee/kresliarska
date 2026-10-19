import { memberSchema } from "@kresliarska/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { loadOrCreateIdentity } from "./identity";

describe("loadOrCreateIdentity", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates a valid identity once and reuses it", () => {
    const first = loadOrCreateIdentity();
    expect(memberSchema.safeParse(first).success).toBe(true);
    expect(loadOrCreateIdentity()).toEqual(first);
  });

  it("replaces a corrupted stored identity", () => {
    localStorage.setItem("kresliarska.identity", "{not json");
    const identity = loadOrCreateIdentity();
    expect(memberSchema.safeParse(identity).success).toBe(true);
    expect(localStorage.getItem("kresliarska.identity")).toBe(JSON.stringify(identity));
  });
});
