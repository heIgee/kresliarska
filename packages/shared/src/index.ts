import { z } from "zod";

export { generateIdentity, IDENTITY_COLORS } from "./identity.js";
export {
  CURSOR_RATE_LIMIT,
  CURSOR_SEND_INTERVAL_MS,
  type Cursor,
  LOBBIES_ROUTE,
  LOBBY_CLOSE_CODES,
  LOBBY_ID_LENGTH,
  LOBBY_MAX_MEMBERS,
  LOBBY_WS_ROUTE,
  type LobbyClientMessage,
  type LobbyResponse,
  type LobbyServerMessage,
  lobbyClientMessageSchema,
  lobbyIdSchema,
  lobbyServerMessageSchema,
  type Member,
  memberSchema,
  type Profile,
  parseLobbyResponse,
  profileSchema,
} from "./lobby.js";

export const HEALTH_ROUTE = "/api/health";

export const healthResponseSchema = z.object({
  ok: z.literal(true),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const parseHealthResponse = (value: unknown): HealthResponse =>
  healthResponseSchema.parse(value);
