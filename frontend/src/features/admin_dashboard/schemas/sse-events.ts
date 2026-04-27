import { z } from "zod";

export const telemetryUpdatedSchema = z.object({
  space_id: z.string(),
  iot_site_id: z.string(),
  iot_office_id: z.string(),
  avg_co2_ppm: z.number(),
  max_occupancy: z.number(),
  window_start: z.string(),
  window_end: z.string()
});
export type TelemetryUpdatedPayload = z.infer<typeof telemetryUpdatedSchema>;

export const alertUpdatedSchema = z.object({
  alert_id: z.string(),
  space_id: z.string(),
  type: z.enum(["CO2", "OCCUPANCY_MAX", "OCCUPANCY_UNEXPECTED"]),
  status: z.enum(["OPEN", "RESOLVED"]),
  started_at: z.string(),
  resolved_at: z.string().nullable()
});
export type AlertUpdatedPayload = z.infer<typeof alertUpdatedSchema>;

export const deviceReportedUpdatedSchema = z.object({
  space_id: z.string(),
  sampling_interval_sec: z.number().int(),
  co2_alert_threshold: z.number().int(),
  firmware_version: z.string(),
  reported_at: z.string()
});
export type DeviceReportedUpdatedPayload = z.infer<
  typeof deviceReportedUpdatedSchema
>;

export type SseEventName =
  | "telemetry_updated"
  | "alert_updated"
  | "device_reported_updated";
