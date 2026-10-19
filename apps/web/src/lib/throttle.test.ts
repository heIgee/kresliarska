import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { throttle } from "./throttle";

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the first call immediately and the latest pending call after the interval", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 50);

    throttled(1);
    throttled(2);
    throttled(3);
    expect(fn.mock.calls).toEqual([[1]]);

    vi.advanceTimersByTime(50);
    expect(fn.mock.calls).toEqual([[1], [3]]);
  });

  it("drops the pending call on cancel", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 50);

    throttled(1);
    throttled(2);
    throttled.cancel();
    vi.advanceTimersByTime(100);
    expect(fn.mock.calls).toEqual([[1]]);
  });
});
