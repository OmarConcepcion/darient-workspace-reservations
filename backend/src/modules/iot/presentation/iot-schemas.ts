import { z } from "zod";

export const spaceIdParamsSchema = z.object({
  space_id: z.string().uuid()
});

export const updateDeviceDesiredSchema = z.object({
  sampling_interval_sec: z.number().int().positive(),
  co2_alert_threshold: z.number().int().positive()
});
