import type { Cursor, Member } from "@kresliarska/shared";
import { describe, expect, it, vi } from "vitest";
import { type Collaborators, createCursorRenderer, stepToward } from "./cursor-renderer";

const member: Member = {
  clientId: "6f1c2a1e-3b4d-4c5e-8f90-1a2b3c4d5e6f",
  name: "Brave Otter",
  color: "#16a34a",
};

const cursorAt = (x: number, y: number): Cursor => ({ x, y, tool: "pointer", button: "up" });

const setup = () => {
  const frames: Array<() => void> = [];
  const renders: Collaborators[] = [];
  const renderer = createCursorRenderer({
    render: (collaborators) => renders.push(collaborators),
    requestFrame: (callback) => frames.push(callback),
    cancelFrame: vi.fn(),
  });
  const runFrames = (): void => {
    while (frames.length > 0) {
      frames.shift()?.();
    }
  };
  const lastPointer = () => [...(renders.at(-1)?.values() ?? [])][0]?.pointer;
  return { renderer, renders, runFrames, lastPointer };
};

describe("stepToward", () => {
  it("covers a fraction of the distance and snaps when close", () => {
    expect(stepToward({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.5)).toEqual({ x: 50, y: 0 });
    const target = { x: 0.2, y: 0 };
    expect(stepToward({ x: 0, y: 0 }, target, 0.5)).toBe(target);
  });
});

describe("createCursorRenderer", () => {
  it("shows a new cursor at its position, then glides to the next one", () => {
    const { renderer, runFrames, lastPointer } = setup();
    renderer.setMembers([member]);

    renderer.setCursor(member.clientId, cursorAt(10, 10));
    runFrames();
    expect(lastPointer()).toMatchObject({ x: 10, y: 10 });

    renderer.setCursor(member.clientId, cursorAt(110, 10));
    runFrames();
    expect(lastPointer()).toMatchObject({ x: 110, y: 10 });
  });

  it("ignores cursors of unknown members and drops cursors of members who left", () => {
    const { renderer, renders, runFrames } = setup();
    renderer.setCursor(member.clientId, cursorAt(1, 1));
    runFrames();
    expect(renders.at(-1)?.size).toBe(0);

    renderer.setMembers([member]);
    expect(renders.at(-1)?.size).toBe(1);

    renderer.setMembers([]);
    renderer.setMembers([member]);
    expect(renders.at(-1)?.size).toBe(0);
  });

  it("removes a cursor when it leaves the canvas", () => {
    const { renderer, renders, runFrames } = setup();
    renderer.setMembers([member]);
    renderer.setCursor(member.clientId, cursorAt(5, 5));
    runFrames();

    renderer.setCursor(member.clientId, null);
    expect(renders.at(-1)?.size).toBe(0);
  });
});
