import { z } from "zod";

export const LOBBIES_ROUTE = "/api/lobbies";
export const LOBBY_WS_ROUTE = "/api/ws/lobby";

export const LOBBY_ID_LENGTH = 8;
export const LOBBY_MAX_MEMBERS = 16;

export const LOBBY_CLOSE_CODES = {
  invalid: 4400,
  notFound: 4404,
  full: 4409,
} as const;

export const lobbyIdSchema = z.string().regex(new RegExp(`^[0-9A-Za-z]{${LOBBY_ID_LENGTH}}$`));

const lobbyResponseSchema = z.object({
  id: lobbyIdSchema,
});

export type LobbyResponse = z.infer<typeof lobbyResponseSchema>;

export const memberSchema = z.object({
  clientId: z.uuid(),
  name: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
});

export type Member = z.infer<typeof memberSchema>;

export const lobbyClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join"),
    lobbyId: lobbyIdSchema,
    member: memberSchema,
  }),
]);

export type LobbyClientMessage = z.infer<typeof lobbyClientMessageSchema>;

export const lobbyServerMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("presence"),
    members: z.array(memberSchema),
  }),
]);

export type LobbyServerMessage = z.infer<typeof lobbyServerMessageSchema>;

export const parseLobbyResponse = (value: unknown): LobbyResponse =>
  lobbyResponseSchema.parse(value);
