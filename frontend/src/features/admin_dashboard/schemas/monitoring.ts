import { z } from "zod";

import { alertSchema } from "./alert";
import { deviceDesiredSchema, deviceReportedSchema } from "./device";

export const telemetryAggregationWireSchema = z.object({
  window_start: z.string(),
  window_end: z.string(),
  avg_temp_c: z.number(),
  avg_humidity_pct: z.number(),
  avg_co2_ppm: z.number(),
  max_co2_ppm: z.number(),
  avg_occupancy: z.number(),
  max_occupancy: z.number(),
  latest_power_w: z.number(),
  sample_count: z.number()
});

export const telemetryAggregationSchema = telemetryAggregationWireSchema
  .transform((raw) => ({
    windowStart: raw.window_start,
    windowEnd: raw.window_end,
    avgTempC: raw.avg_temp_c,
    avgHumidityPct: raw.avg_humidity_pct,
    avgCo2Ppm: raw.avg_co2_ppm,
    maxCo2Ppm: raw.max_co2_ppm,
    avgOccupancy: raw.avg_occupancy,
    maxOccupancy: raw.max_occupancy,
    latestPowerW: raw.latest_power_w,
    sampleCount: raw.sample_count
  }));

export type TelemetryAggregation = z.output<typeof telemetryAggregationSchema>;

export const officeHourSchema = z.object({
  day_of_week: z.number().int(),
  opens_at: z.string(),
  closes_at: z.string(),
  is_enabled: z.boolean()
});

export const monitoringSnapshotWireSchema = z.object({
  space_id: z.string(),
  iot_site_id: z.string(),
  iot_office_id: z.string(),
  capacity: z.number().int(),
  timezone: z.string(),
  office_hours: z.array(officeHourSchema),
  latest_telemetry: telemetryAggregationSchema.nullable(),
  device_desired: deviceDesiredSchema.nullable(),
  device_reported: deviceReportedSchema.nullable(),
  active_alerts: z.array(alertSchema)
});

export const monitoringSnapshotSchema = monitoringSnapshotWireSchema.transform(
  (raw) => ({
    spaceId: raw.space_id,
    iotSiteId: raw.iot_site_id,
    iotOfficeId: raw.iot_office_id,
    capacity: raw.capacity,
    timezone: raw.timezone,
    officeHours: raw.office_hours.map((rule) => ({
      dayOfWeek: rule.day_of_week,
      opensAt: rule.opens_at,
      closesAt: rule.closes_at,
      isEnabled: rule.is_enabled
    })),
    latestTelemetry: raw.latest_telemetry,
    deviceDesired: raw.device_desired,
    deviceReported: raw.device_reported,
    activeAlerts: raw.active_alerts
  })
);

export type MonitoringSnapshot = z.output<typeof monitoringSnapshotSchema>;
