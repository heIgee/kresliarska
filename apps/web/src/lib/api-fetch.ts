const TRANSIENT_STATUSES = new Set([502, 504]);
const DEFAULT_MAX_RETRIES = 5;
const BASE_DELAY_MS = 400;
const MAX_DELAY_MS = 4_000;

export class ApiUnavailableError extends Error {
  constructor(message = "API temporarily unavailable") {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// fetch rejects with TypeError on network failure.
const isNetworkError = (error: unknown): boolean => error instanceof TypeError;

export const apiFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { maxRetries?: number },
): Promise<Response> => {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  let attempt = 0;
  let delayMs = BASE_DELAY_MS;

  for (;;) {
    try {
      const response = await fetch(input, { ...init, credentials: "include" });
      if (TRANSIENT_STATUSES.has(response.status) && attempt < maxRetries) {
        attempt += 1;
        await sleep(delayMs);
        delayMs = Math.min(delayMs * 2, MAX_DELAY_MS);
        continue;
      }
      return response;
    } catch (error: unknown) {
      if (!isNetworkError(error)) {
        throw error;
      }
      if (attempt >= maxRetries) {
        throw new ApiUnavailableError();
      }
      attempt += 1;
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, MAX_DELAY_MS);
    }
  }
};
