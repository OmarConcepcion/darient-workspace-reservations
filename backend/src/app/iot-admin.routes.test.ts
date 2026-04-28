import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import type {
  AlertRecord,
  DeviceDesiredRecord,
  DeviceReportedRecord,
  MonitoringSnapshot,
  SpaceTelemetryContext,
  TelemetryAggregationRecord
} from "../modules/iot/domain/iot.js";
import type { IotRepository } from "../modules/iot/ports/iot-repository.js";
import type { ReservationRepository } from "../modules/reservations/ports/reservation-repository.js";
import type { SpaceRepository } from "../modules/spaces/ports/space-repository.js";
import type { PlaceRepository } from "../modules/places/ports/place-repository.js";
import { InMemorySsePublisher } from "../shared/sse/in-memory-sse-publisher.js";

const apiKey = { "x-api-key": "test-api-key" };
const fixedNow = new Date("2026-04-27T15:10:00.000Z");
const spaceId = randomUUID();
const placeId = randomUUID();

const spaceContext: SpaceTelemetryContext = {
  spaceId,
  placeId,
  iotSiteId: "SITE_A",
  iotOfficeId: "OFFICE_1",
  capacity: 4,
  timezone: "America/Panama",
  officeHours: []
};

const latestAggregation: TelemetryAggregationRecord = {
  id: randomUUID(),
  spaceId,
  windowStart: new Date("2026-04-27T15:10:00.000Z"),
  windowEnd: new Date("2026-04-27T15:10:59.999Z"),
  avgTempC: 24.1,
  avgHumidityPct: 49.3,
  avgCo2Ppm: 930,
  maxCo2Ppm: 930,
  avgOccupancy: 4,
  maxOccupancy: 4,
  latestPowerW: 120,
  sampleCount: 1,
  createdAt: fixedNow,
  updatedAt: fixedNow
};

const desired: DeviceDesiredRecord = {
  id: randomUUID(),
  spaceId,
  samplingIntervalSec: 10,
  co2AlertThreshold: 1000,
  publishStatus: "PENDING",
  lastPublishedAt: null,
  publishError: null,
  createdAt: fixedNow,
  updatedAt: fixedNow
};

const reported: DeviceReportedRecord = {
  id: randomUUID(),
  spaceId,
  samplingIntervalSec: 10,
  co2AlertThreshold: 1000,
  firmwareVersion: "1.0.0",
  reportedAt: fixedNow,
  createdAt: fixedNow,
  updatedAt: fixedNow
};

const alert: AlertRecord = {
  id: randomUUID(),
  spaceId,
  type: "CO2",
  status: "OPEN",
  startedAt: fixedNow,
  resolvedAt: null,
  metadata: { latest_co2_ppm: 1100 },
  createdAt: fixedNow,
  updatedAt: fixedNow
};

const createDependencies = () => {
  const ssePublisher = new InMemorySsePublisher();
  const monitoringSnapshot: MonitoringSnapshot = {
    space: spaceContext,
    latestAggregation,
    deviceDesired: desired,
    deviceReported: reported,
    activeAlerts: [alert]
  };

  const iotRepository: IotRepository = {
    createRawTelemetry: async () => {
      throw new Error("not used");
    },
    markRawTelemetryProcessed: async () => undefined,
    markRawTelemetryFailed: async () => undefined,
    findSpaceContextByIotIds: async () => null,
    upsertTelemetryAggregation: async () => latestAggregation,
    getTelemetryAggregation: async () => latestAggregation,
    listRecentTelemetrySamples: async () => [],
    appendTelemetrySample: async () => undefined,
    getDeviceDesiredBySpaceId: async () => desired,
    upsertDeviceDesired: async (input) => ({
      ...desired,
      ...input,
      updatedAt: fixedNow
    }),
    upsertDeviceReported: async () => reported,
    getDeviceReportedBySpaceId: async () => reported,
    getAlertBySpaceIdAndType: async () => alert,
    createAlert: async () => alert,
    updateAlert: async () => alert,
    listAlertsBySpaceId: async () => [alert],
    hasActiveReservationAt: async () => false,
    getMonitoringSnapshot: async () => monitoringSnapshot,
    findSpaceContextBySpaceId: async (id) => (id === spaceId ? spaceContext : null)
  };

  const placeRepository: PlaceRepository = {
    create: async () => {
      throw new Error("not used");
    },
    findAll: async () => [],
    findById: async () => null,
    update: async () => null,
    delete: async () => false
  };

  const spaceRepository: SpaceRepository = {
    create: async () => {
      throw new Error("not used");
    },
    findAll: async () => [],
    findById: async () => null,
    findOfficeHour: async () => null,
    update: async () => null,
    delete: async () => false
  };

  const reservationRepository: ReservationRepository = {
    create: async () => {
      throw new Error("not used");
    },
    findById: async () => null,
    findPaginated: async () => ({ data: [], total: 0 }),
    update: async () => null,
    delete: async () => false,
    findActiveOverlaps: async () => [],
    findActiveBySpaceBetween: async () => [],
    countActiveByCustomerEmailBetween: async () => 0
  };

  return {
    ssePublisher,
    dependencies: {
      placeRepository,
      spaceRepository,
      reservationRepository,
      iotRepository,
      mqttPublisher: {
        publishJson: async () => undefined
      },
      nowProvider: () => fixedNow,
      ssePublisher
    }
  };
};

describe("iot admin routes", () => {
  it("returns monitoring snapshot for a space", async () => {
    const { dependencies } = createDependencies();
    const app = createApp(dependencies);

    const response = await request(app)
      .get(`/api/v1/admin/spaces/${spaceId}/monitoring`)
      .set(apiKey);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      space_id: spaceId,
      latest_telemetry: {
        avg_co2_ppm: 930
      },
      device_desired: {
        sampling_interval_sec: 10
      },
      device_reported: {
        firmware_version: "1.0.0"
      }
    });
  });

  it("returns alerts and exposes the SSE stream endpoint", async () => {
    const { dependencies } = createDependencies();
    const app = createApp(dependencies);

    const alertsResponse = await request(app)
      .get(`/api/v1/admin/spaces/${spaceId}/alerts`)
      .set(apiKey);

    expect(alertsResponse.status).toBe(200);
    expect(alertsResponse.body.data[0]).toMatchObject({
      type: "CO2",
      status: "OPEN"
    });

    const streamResponse = await request(app)
      .get("/api/v1/admin/events/stream")
      .set(apiKey)
      .buffer(false)
      .parse((response, callback) => {
        response.once("data", (chunk) => {
          callback(null, chunk.toString());
          (
            response as unknown as NodeJS.ReadableStream & { destroy: () => void }
          ).destroy();
        });
      });

    expect(streamResponse.status).toBe(200);
    expect(streamResponse.headers["content-type"]).toContain("text/event-stream");
  });

  it("returns 502 when device desired publish fails", async () => {
    const { ssePublisher, dependencies } = createDependencies();
    const app = createApp({
      ...dependencies,
      mqttPublisher: {
        publishJson: async () => {
          throw new Error("broker unavailable");
        }
      },
      ssePublisher
    });

    const response = await request(app)
      .patch(`/api/v1/admin/spaces/${spaceId}/device_desired`)
      .set(apiKey)
      .send({
        sampling_interval_sec: 5,
        co2_alert_threshold: 900
      });

    expect(response.status).toBe(502);
    expect(response.body).toMatchObject({
      error: {
        code: "MQTT_PUBLISH_FAILED"
      }
    });
  });
});
