import type {
  AlertRecord,
  AlertStatus,
  AlertType,
  DeviceDesiredInput,
  DeviceDesiredRecord,
  DeviceReportedRecord,
  MonitoringSnapshot,
  RawTelemetryRecord,
  RawTelemetryStatus,
  SpaceTelemetryContext,
  TelemetryAggregationRecord,
  TelemetrySample
} from "../domain/iot.js";

export type IotRepository = {
  createRawTelemetry(input: {
    topic: string;
    siteId: string;
    officeId: string;
    payload: Record<string, unknown>;
    processingStatus: RawTelemetryStatus;
  }): Promise<RawTelemetryRecord>;
  markRawTelemetryProcessed(id: string): Promise<void>;
  markRawTelemetryFailed(id: string, errorMessage: string): Promise<void>;
  findSpaceContextByIotIds(
    siteId: string,
    officeId: string
  ): Promise<SpaceTelemetryContext | null>;
  findSpaceContextBySpaceId(spaceId: string): Promise<SpaceTelemetryContext | null>;
  upsertTelemetryAggregation(input: Omit<TelemetryAggregationRecord, "id" | "createdAt" | "updatedAt">): Promise<TelemetryAggregationRecord>;
  getTelemetryAggregation(
    spaceId: string,
    windowStart: Date
  ): Promise<TelemetryAggregationRecord | null>;
  listRecentTelemetrySamples(
    siteId: string,
    officeId: string,
    since: Date
  ): Promise<TelemetrySample[]>;
  appendTelemetrySample(sample: TelemetrySample): Promise<void>;
  getDeviceDesiredBySpaceId(spaceId: string): Promise<DeviceDesiredRecord | null>;
  upsertDeviceDesired(input: {
    spaceId: string;
    samplingIntervalSec: number;
    co2AlertThreshold: number;
    publishStatus: DeviceDesiredRecord["publishStatus"];
    lastPublishedAt: Date | null;
    publishError: string | null;
  }): Promise<DeviceDesiredRecord>;
  upsertDeviceReported(input: {
    spaceId: string;
    samplingIntervalSec: number;
    co2AlertThreshold: number;
    firmwareVersion: string;
    reportedAt: Date;
  }): Promise<DeviceReportedRecord>;
  getDeviceReportedBySpaceId(spaceId: string): Promise<DeviceReportedRecord | null>;
  getAlertBySpaceIdAndType(
    spaceId: string,
    type: AlertType
  ): Promise<AlertRecord | null>;
  createAlert(input: {
    spaceId: string;
    type: AlertType;
    status: AlertStatus;
    startedAt: Date;
    resolvedAt: Date | null;
    metadata: Record<string, unknown> | null;
  }): Promise<AlertRecord>;
  updateAlert(
    id: string,
    input: Partial<Pick<AlertRecord, "status" | "resolvedAt" | "metadata">>
  ): Promise<AlertRecord | null>;
  listAlertsBySpaceId(spaceId: string): Promise<AlertRecord[]>;
  hasActiveReservationAt(spaceId: string, at: Date): Promise<boolean>;
  getMonitoringSnapshot(spaceId: string): Promise<MonitoringSnapshot | null>;
};
