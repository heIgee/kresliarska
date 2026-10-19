import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const envPath = join(dirname(fileURLToPath(import.meta.url)), "../.env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const DEFAULT_PORT = 3000;

export type ApiConfig = {
  port: number;
};

const readPort = (): number => {
  const raw = process.env.PORT?.trim();
  if (!raw) {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT must be a positive integer, got "${raw}"`);
  }
  return port;
};

export const loadConfig = (): ApiConfig => ({
  port: readPort(),
});
