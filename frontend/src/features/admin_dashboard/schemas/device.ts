import { z } from "zod";

export const deviceDesiredPublishStatusSchema = z.enum([
  "PENDING",
  "PUBLISHED",
  "FAILED"
]);
export type DeviceDesiredPublishStatus = z.infer<
  typeof deviceDesiredPublishStatusSchema
>;

export const deviceDesiredWireSchema = z.object({
  sampling_interval_sec: z.number().int(),
  co2_alert_threshold: z.number().int(),
  publish_status: deviceDesiredPublishStatusSchema,
  last_published_at: z.string().nullable(),
  publish_error: z.string().nullable()
});

export const deviceDesiredSchema = deviceDesiredWireSchema.transform((raw) => ({
  samplingIntervalSec: raw.sampling_interval_sec,
  co2AlertThreshold: raw.co2_alert_threshold,
  publishStatus: raw.publish_status,
  lastPublishedAt: raw.last_published_at,
  publishError: raw.publish_error
}));

export type DeviceDesired = z.output<typeof deviceDesiredSchema>;

export const deviceReportedWireSchema = z.object({
  sampling_interval_sec: z.number().int(),
  co2_alert_threshold: z.number().int(),
  firmware_version: z.string(),
  reported_at: z.string()
});

export const deviceReportedSchema = deviceReportedWireSchema.transform(
  (raw) => ({
    samplingIntervalSec: raw.sampling_interval_sec,
    co2AlertThreshold: raw.co2_alert_threshold,
    firmwareVersion: raw.firmware_version,
    reportedAt: raw.reported_at
  })
);

export type DeviceReported = z.output<typeof deviceReportedSchema>;

export const deviceDesiredFormSchema = z.object({
  sampling_interval_sec: z.coerce
    .number()
    .int("Must be an integer")
    .positive("Must be greater than 0")
    .max(3600, "Must be at most 3600 seconds"),
  co2_alert_threshold: z.coerce
    .number()
    .int("Must be an integer")
    .positive("Must be greater than 0")
    .max(10000, "Must be at most 10000 ppm")
});

export type DeviceDesiredFormValues = z.input<typeof deviceDesiredFormSchema>;
