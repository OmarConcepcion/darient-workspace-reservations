export type OfficeHourRule = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isEnabled: boolean;
};

export type SpaceTelemetryContext = {
  spaceId: string;
  placeId: string;
  iotSiteId: string;
  iotOfficeId: string;
  capacity: number;
  timezone: string;
  officeHours: OfficeHourRule[];
};

export type RawTelemetryStatus = "RECEIVED" | "PROCESSED" | "FAILED";
export type AlertType = "CO2" | "OCCUPANCY_MAX" | "OCCUPANCY_UNEXPECTED";
export type AlertStatus = "OPEN" | "RESOLVED";
export type DeviceDesiredPublishStatus = "PENDING" | "PUBLISHED" | "FAILED";

export type RawTelemetryRecord = {
  id: string;
  topic: string;
  siteId: string;
  officeId: string;
  payload: Record<string, unknown>;
  processingStatus: RawTelemetryStatus;
  receivedAt: Date;
  processedAt: Date | null;
  errorMessage: string | null;
};

export type TelemetrySample = {
  topic: string;
  siteId: string;
  officeId: string;
  timestamp: Date;
  tempC: number;
  humidityPct: number;
  co2Ppm: number;
  occupancy: number;
  powerW: number;
};

export type TelemetryAggregationRecord = {
  id: string;
  spaceId: string;
  windowStart: Date;
  windowEnd: Date;
  avgTempC: number;
  avgHumidityPct: number;
  avgCo2Ppm: number;
  maxCo2Ppm: number;
  avgOccupancy: number;
  maxOccupancy: number;
  latestPowerW: number;
  sampleCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type DeviceDesiredRecord = {
  id: string;
  spaceId: string;
  samplingIntervalSec: number;
  co2AlertThreshold: number;
  publishStatus: DeviceDesiredPublishStatus;
  lastPublishedAt: Date | null;
  publishError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DeviceReportedRecord = {
  id: string;
  spaceId: string;
  samplingIntervalSec: number;
  co2AlertThreshold: number;
  firmwareVersion: string;
  reportedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AlertRecord = {
  id: string;
  spaceId: string;
  type: AlertType;
  status: AlertStatus;
  startedAt: Date;
  resolvedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MonitoringSnapshot = {
  space: SpaceTelemetryContext;
  latestAggregation: TelemetryAggregationRecord | null;
  deviceDesired: DeviceDesiredRecord | null;
  deviceReported: DeviceReportedRecord | null;
  activeAlerts: AlertRecord[];
};

export type DeviceDesiredInput = {
  samplingIntervalSec: number;
  co2AlertThreshold: number;
};
