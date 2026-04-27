import type {
  AlertRecord,
  DeviceDesiredRecord,
  DeviceReportedRecord,
  MonitoringSnapshot,
  TelemetryAggregationRecord
} from "../domain/iot.js";

export const toTelemetryAggregationResponse = (
  aggregation: TelemetryAggregationRecord | null
) =>
  aggregation
    ? {
        window_start: aggregation.windowStart.toISOString(),
        window_end: aggregation.windowEnd.toISOString(),
        avg_temp_c: aggregation.avgTempC,
        avg_humidity_pct: aggregation.avgHumidityPct,
        avg_co2_ppm: aggregation.avgCo2Ppm,
        max_co2_ppm: aggregation.maxCo2Ppm,
        avg_occupancy: aggregation.avgOccupancy,
        max_occupancy: aggregation.maxOccupancy,
        latest_power_w: aggregation.latestPowerW,
        sample_count: aggregation.sampleCount
      }
    : null;

export const toDeviceDesiredResponse = (desired: DeviceDesiredRecord | null) =>
  desired
    ? {
        sampling_interval_sec: desired.samplingIntervalSec,
        co2_alert_threshold: desired.co2AlertThreshold,
        publish_status: desired.publishStatus,
        last_published_at: desired.lastPublishedAt?.toISOString() ?? null,
        publish_error: desired.publishError
      }
    : null;

export const toDeviceReportedResponse = (reported: DeviceReportedRecord | null) =>
  reported
    ? {
        sampling_interval_sec: reported.samplingIntervalSec,
        co2_alert_threshold: reported.co2AlertThreshold,
        firmware_version: reported.firmwareVersion,
        reported_at: reported.reportedAt.toISOString()
      }
    : null;

export const toAlertResponse = (alert: AlertRecord) => ({
  alert_id: alert.id,
  space_id: alert.spaceId,
  type: alert.type,
  status: alert.status,
  started_at: alert.startedAt.toISOString(),
  resolved_at: alert.resolvedAt?.toISOString() ?? null,
  metadata: alert.metadata
});

export const toMonitoringResponse = (snapshot: MonitoringSnapshot) => ({
  space_id: snapshot.space.spaceId,
  iot_site_id: snapshot.space.iotSiteId,
  iot_office_id: snapshot.space.iotOfficeId,
  capacity: snapshot.space.capacity,
  timezone: snapshot.space.timezone,
  office_hours: snapshot.space.officeHours.map((rule) => ({
    day_of_week: rule.dayOfWeek,
    opens_at: rule.opensAt,
    closes_at: rule.closesAt,
    is_enabled: rule.isEnabled
  })),
  latest_telemetry: toTelemetryAggregationResponse(snapshot.latestAggregation),
  device_desired: toDeviceDesiredResponse(snapshot.deviceDesired),
  device_reported: toDeviceReportedResponse(snapshot.deviceReported),
  active_alerts: snapshot.activeAlerts.map(toAlertResponse)
});
