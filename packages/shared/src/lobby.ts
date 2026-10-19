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

export const profileSchema = memberSchema.pick({ name: true, color: true });

export type Profile = z.infer<typeof profileSchema>;

/** Client-side send cadence; the server limit below leaves headroom for jitter. */
export const CURSOR_SEND_INTERVAL_MS = 50;
export const CURSOR_RATE_LIMIT = { max: 40, windowMs: 1_000 } as const;

/** Scene coordinates, so cursors stay put regardless of each viewer's pan and zoom. */
const cursorSchema = z.object({
  x: z.number(),
  y: z.number(),
  tool: z.enum(["pointer", "laser"]),
  button: z.enum(["up", "down"]),
});

export type Cursor = z.infer<typeof cursorSchema>;

export const lobbyClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join"),
    lobbyId: lobbyIdSchema,
    member: memberSchema,
  }),
  z.object({
    type: z.literal("cursor"),
    cursor: cursorSchema.nullable(),
  }),
  z.object({
    type: z.literal("rename"),
    profile: profileSchema,
  }),
]);

export type LobbyClientMessage = z.infer<typeof lobbyClientMessageSchema>;

export const lobbyServerMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("presence"),
    members: z.array(memberSchema),
  }),
  z.object({
    type: z.literal("cursor"),
    clientId: z.uuid(),
    cursor: cursorSchema.nullable(),
  }),
]);

export type LobbyServerMessage = z.infer<typeof lobbyServerMessageSchema>;

export const parseLobbyResponse = (value: unknown): LobbyResponse =>
  lobbyResponseSchema.parse(value);
