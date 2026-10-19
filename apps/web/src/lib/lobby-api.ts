import { LOBBIES_ROUTE, lobbyIdSchema, parseLobbyResponse } from "@kresliarska/shared";
import { apiFetch } from "./api-fetch";

export const createLobby = async (): Promise<string> => {
  const response = await apiFetch(LOBBIES_ROUTE, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Could not create lobby (${response.status})`);
  }
  return parseLobbyResponse(await response.json()).id;
};

export const lobbyExists = async (id: string): Promise<boolean> => {
  const response = await apiFetch(`${LOBBIES_ROUTE}/${id}`);
  if (response.status === 404) {
    return false;
  }
  if (!response.ok) {
    throw new Error(`Could not look up lobby (${response.status})`);
  }
  return true;
};

const LOBBY_PATH_PATTERN = /\/l\/([0-9A-Za-z]+)\/?$/;

/** Accepts a bare code or a pasted lobby link. */
export const parseLobbyCode = (input: string): string | undefined => {
  const trimmed = input.trim();
  const candidate = LOBBY_PATH_PATTERN.exec(trimmed)?.[1] ?? trimmed;
  return lobbyIdSchema.safeParse(candidate).success ? candidate : undefined;
};
