export type Throttled<A extends unknown[]> = ((...args: A) => void) & { cancel: () => void };

/** Runs immediately, then at most once per interval with the latest arguments. */
export const throttle = <A extends unknown[]>(
  fn: (...args: A) => void,
  intervalMs: number,
  now: () => number = Date.now,
): Throttled<A> => {
  let lastRun = Number.NEGATIVE_INFINITY;
  let pending: A | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const run = (args: A): void => {
    lastRun = now();
    fn(...args);
  };

  const cancel = (): void => {
    clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };

  const throttled = (...args: A): void => {
    const wait = intervalMs - (now() - lastRun);
    if (wait <= 0) {
      cancel();
      run(args);
      return;
    }
    pending = args;
    timer ??= setTimeout(() => {
      timer = undefined;
      const next = pending;
      pending = undefined;
      if (next) {
        run(next);
      }
    }, wait);
  };

  return Object.assign(throttled, { cancel });
};
