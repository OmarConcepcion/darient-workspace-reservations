import { z } from "zod";

export const alertTypeSchema = z.enum([
  "CO2",
  "OCCUPANCY_MAX",
  "OCCUPANCY_UNEXPECTED"
]);
export type AlertType = z.infer<typeof alertTypeSchema>;

export const alertStatusSchema = z.enum(["OPEN", "RESOLVED"]);
export type AlertStatus = z.infer<typeof alertStatusSchema>;

export const alertWireSchema = z.object({
  alert_id: z.string(),
  space_id: z.string(),
  type: alertTypeSchema,
  status: alertStatusSchema,
  started_at: z.string(),
  resolved_at: z.string().nullable(),
  metadata: z.unknown().nullable().optional()
});

export const alertSchema = alertWireSchema.transform((raw) => ({
  alertId: raw.alert_id,
  spaceId: raw.space_id,
  type: raw.type,
  status: raw.status,
  startedAt: raw.started_at,
  resolvedAt: raw.resolved_at,
  metadata: raw.metadata ?? null
}));

export type Alert = z.output<typeof alertSchema>;

export const alertListResponseSchema = z.object({
  data: z.array(alertSchema)
});
