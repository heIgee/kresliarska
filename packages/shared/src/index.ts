import { z } from "zod";

export const HEALTH_ROUTE = "/api/health";

export const healthResponseSchema = z.object({
  ok: z.literal(true),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const parseHealthResponse = (value: unknown): HealthResponse =>
  healthResponseSchema.parse(value);
