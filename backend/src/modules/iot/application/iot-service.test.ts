import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { AppError } from "../../../shared/errors/app-error.js";
import { IotService } from "./iot-service.js";
import type {
  AlertRecord,
  DeviceDesiredRecord,
  DeviceReportedRecord,
  MonitoringSnapshot,
  RawTelemetryRecord,
  SpaceTelemetryContext,
  TelemetryAggregationRecord,
  TelemetrySample
} from "../domain/iot.js";
import type { IotRepository } from "../ports/iot-repository.js";
import type { MqttPublisher } from "../ports/mqtt-publisher.js";
import type { SsePublisher } from "../ports/sse-publisher.js";

const fixedNow = new Date("2026-04-27T15:10:00.000Z");

const context: SpaceTelemetryContext = {
  spaceId: randomUUID(),
  placeId: randomUUID(),
  iotSiteId: "SITE_A",
  iotOfficeId: "OFFICE_1",
  capacity: 4,
  timezone: "America/Panama",
  officeHours: [
    {
      dayOfWeek: 1,
      opensAt: "08:00",
      closesAt: "18:00",
      isEnabled: true
    }
  ]
};

const createTelemetryPayload = (overrides: Partial<Record<string, unknown>> = {}) =>
  JSON.stringify({
    ts: "2026-04-27T15:10:00.000Z",
    temp_c: 24.1,
    humidity_pct: 49.3,
    co2_ppm: 900,
    occupancy: 3,
    power_w: 120,
    ...overrides
  });

const telemetryTopic = "sites/SITE_A/offices/OFFICE_1/telemetry";
const reportedTopic = "sites/SITE_A/offices/OFFICE_1/reported";

const createRepository = (options?: {
  hasActiveReservationAt?: (at: Date) => boolean;
  desiredOverrides?: Partial<DeviceDesiredRecord>;
  contextOverrides?: Partial<SpaceTelemetryContext>;
}) => {
  const repositoryContext: SpaceTelemetryContext = {
    ...context,
    ...options?.contextOverrides
  };
  const rawTelemetry = new Map<string, RawTelemetryRecord>();
  const telemetrySamples: TelemetrySample[] = [];
  const aggregations = new Map<string, TelemetryAggregationRecord>();
  const alerts = new Map<string, AlertRecord>();
  const desiredBySpaceId = new Map<string, DeviceDesiredRecord>([
    [
      repositoryContext.spaceId,
      {
        id: randomUUID(),
        spaceId: repositoryContext.spaceId,
        samplingIntervalSec: 10,
        co2AlertThreshold: 1000,
        publishStatus: "PENDING",
        lastPublishedAt: null,
        publishError: null,
        createdAt: fixedNow,
        updatedAt: fixedNow,
        ...options?.desiredOverrides
      }
    ]
  ]);
  const reportedBySpaceId = new Map<string, DeviceReportedRecord>();

  const repository: IotRepository = {
    createRawTelemetry: async (input) => {
      const record: RawTelemetryRecord = {
        id: randomUUID(),
        ...input,
        receivedAt: fixedNow,
        processedAt: null,
        errorMessage: null
      };
      rawTelemetry.set(record.id, record);
      return record;
    },
    markRawTelemetryProcessed: async (id) => {
      const current = rawTelemetry.get(id);
      if (!current) return;
      rawTelemetry.set(id, {
        ...current,
        processingStatus: "PROCESSED",
        processedAt: fixedNow
      });
    },
    markRawTelemetryFailed: async (id, errorMessage) => {
      const current = rawTelemetry.get(id);
      if (!current) return;
      rawTelemetry.set(id, {
        ...current,
        processingStatus: "FAILED",
        processedAt: fixedNow,
        errorMessage
      });
    },
    findSpaceContextByIotIds: async (siteId, officeId) =>
      siteId === repositoryContext.iotSiteId && officeId === repositoryContext.iotOfficeId
        ? repositoryContext
        : null,
    upsertTelemetryAggregation: async (input) => {
      const key = `${input.spaceId}:${input.windowStart.toISOString()}`;
      const record: TelemetryAggregationRecord = {
        id: aggregations.get(key)?.id ?? randomUUID(),
        createdAt: aggregations.get(key)?.createdAt ?? fixedNow,
        updatedAt: fixedNow,
        ...input
      };
      aggregations.set(key, record);
      return record;
    },
    getTelemetryAggregation: async (spaceId, windowStart) =>
      aggregations.get(`${spaceId}:${windowStart.toISOString()}`) ?? null,
    listRecentTelemetrySamples: async () => telemetrySamples,
    appendTelemetrySample: async (sample) => {
      telemetrySamples.push(sample);
    },
    getDeviceDesiredBySpaceId: async (spaceId) => desiredBySpaceId.get(spaceId) ?? null,
    upsertDeviceDesired: async (input) => {
      const record: DeviceDesiredRecord = {
        id: desiredBySpaceId.get(input.spaceId)?.id ?? randomUUID(),
        createdAt: desiredBySpaceId.get(input.spaceId)?.createdAt ?? fixedNow,
        updatedAt: fixedNow,
        ...input
      };
      desiredBySpaceId.set(input.spaceId, record);
      return record;
    },
    upsertDeviceReported: async (input) => {
      const record: DeviceReportedRecord = {
        id: reportedBySpaceId.get(input.spaceId)?.id ?? randomUUID(),
        createdAt: reportedBySpaceId.get(input.spaceId)?.createdAt ?? fixedNow,
        updatedAt: fixedNow,
        ...input
      };
      reportedBySpaceId.set(input.spaceId, record);
      return record;
    },
    getDeviceReportedBySpaceId: async (spaceId) =>
      reportedBySpaceId.get(spaceId) ?? null,
    getAlertBySpaceIdAndType: async (spaceId, type) =>
      [...alerts.values()].find((alert) => alert.spaceId === spaceId && alert.type === type) ??
      null,
    createAlert: async (input) => {
      const record: AlertRecord = {
        id: randomUUID(),
        createdAt: fixedNow,
        updatedAt: fixedNow,
        ...input
      };
      alerts.set(record.id, record);
      return record;
    },
    updateAlert: async (id, input) => {
      const current = alerts.get(id);
      if (!current) return null;
      const record: AlertRecord = {
        ...current,
        ...input,
        updatedAt: fixedNow
      };
      alerts.set(id, record);
      return record;
    },
    listAlertsBySpaceId: async (spaceId) =>
      [...alerts.values()].filter((alert) => alert.spaceId === spaceId),
    hasActiveReservationAt: async (_spaceId, at) =>
      options?.hasActiveReservationAt?.(at) ?? false,
    getMonitoringSnapshot: async (spaceId) => {
      const latestAggregation = [...aggregations.values()]
        .filter((aggregation) => aggregation.spaceId === spaceId)
        .sort((left, right) => right.windowStart.getTime() - left.windowStart.getTime())[0] ??
        null;

      return {
        space: repositoryContext,
        latestAggregation,
        deviceDesired: desiredBySpaceId.get(spaceId) ?? null,
        deviceReported: reportedBySpaceId.get(spaceId) ?? null,
        activeAlerts: [...alerts.values()].filter(
          (alert) => alert.spaceId === spaceId && alert.status === "OPEN"
        )
      } satisfies MonitoringSnapshot;
    },
    findSpaceContextBySpaceId: async (spaceId) =>
      spaceId === repositoryContext.spaceId ? repositoryContext : null
  };

  return {
    repository,
    repositoryContext,
    rawTelemetry,
    telemetrySamples,
    aggregations,
    alerts,
    desiredBySpaceId,
    reportedBySpaceId
  };
};

describe("IotService", () => {
  it("processes telemetry, stores aggregation, and emits telemetry SSE", async () => {
    const state = createRepository();
    const mqttPublisher: MqttPublisher = {
      publishJson: async () => undefined
    };
    const sseEvents: Array<{ event: string; data: unknown }> = [];
    const ssePublisher: SsePublisher = {
      publish: (event, data) => {
        sseEvents.push({ event, data });
      }
    };
    const service = new IotService(
      state.repository,
      mqttPublisher,
      ssePublisher,
      () => fixedNow
    );

    await service.processTelemetryMessage(
      telemetryTopic,
      createTelemetryPayload({ co2_ppm: 1100, occupancy: 5 })
    );

    expect(state.rawTelemetry.size).toBe(1);
    expect(state.telemetrySamples).toHaveLength(1);
    expect([...state.aggregations.values()][0]).toMatchObject({
      avgCo2Ppm: 1100,
      maxOccupancy: 5,
      sampleCount: 1
    });
    expect(sseEvents[0]?.event).toBe("telemetry_updated");
  });

  it("stores reported state and emits device reported SSE", async () => {
    const state = createRepository();
    const mqttPublisher: MqttPublisher = {
      publishJson: async () => undefined
    };
    const sseEvents: Array<{ event: string; data: unknown }> = [];
    const ssePublisher: SsePublisher = {
      publish: (event, data) => {
        sseEvents.push({ event, data });
      }
    };
    const service = new IotService(
      state.repository,
      mqttPublisher,
      ssePublisher,
      () => fixedNow
    );

    await service.processReportedMessage(
      reportedTopic,
      JSON.stringify({
        ts: "2026-04-27T15:10:00.000Z",
        samplingIntervalSec: 5,
        co2_alert_threshold: 900,
        firmwareVersion: "1.0.0"
      })
    );

    expect(state.reportedBySpaceId.get(context.spaceId)).toMatchObject({
      samplingIntervalSec: 5,
      co2AlertThreshold: 900,
      firmwareVersion: "1.0.0"
    });
    expect(sseEvents[0]?.event).toBe("device_reported_updated");
  });

  it("updates desired state, publishes MQTT, and returns monitoring snapshot", async () => {
    const state = createRepository();
    const published: Array<{ topic: string; payload: unknown }> = [];
    const mqttPublisher: MqttPublisher = {
      publishJson: async (topic, payload) => {
        published.push({ topic, payload });
      }
    };
    const sseEvents: Array<{ event: string; data: unknown }> = [];
    const ssePublisher: SsePublisher = {
      publish: (event, data) => {
        sseEvents.push({ event, data });
      }
    };
    const service = new IotService(
      state.repository,
      mqttPublisher,
      ssePublisher,
      () => fixedNow
    );

    const desired = await service.updateDeviceDesired(context.spaceId, {
      samplingIntervalSec: 5,
      co2AlertThreshold: 900
    });
    const monitoring = await service.getMonitoring(context.spaceId);

    expect(desired).toMatchObject({
      samplingIntervalSec: 5,
      co2AlertThreshold: 900,
      publishStatus: "PUBLISHED"
    });
    expect(published[0]).toEqual({
      topic: "sites/SITE_A/offices/OFFICE_1/desired",
      payload: {
        samplingIntervalSec: 5,
        co2_alert_threshold: 900
      }
    });
    expect(monitoring.deviceDesired?.samplingIntervalSec).toBe(5);
    expect(sseEvents).toHaveLength(0);
  });

  it("marks desired as failed and throws transport error when mqtt publish fails", async () => {
    const state = createRepository();
    const mqttPublisher: MqttPublisher = {
      publishJson: async () => {
        throw new Error("broker unavailable");
      }
    };
    const ssePublisher: SsePublisher = {
      publish: () => undefined
    };
    const service = new IotService(
      state.repository,
      mqttPublisher,
      ssePublisher,
      () => fixedNow
    );

    await expect(
      service.updateDeviceDesired(context.spaceId, {
        samplingIntervalSec: 5,
        co2AlertThreshold: 900
      })
    ).rejects.toMatchObject({
      statusCode: 502,
      code: "MQTT_PUBLISH_FAILED"
    } satisfies Partial<AppError>);

    expect(state.desiredBySpaceId.get(context.spaceId)).toMatchObject({
      samplingIntervalSec: 5,
      co2AlertThreshold: 900,
      publishStatus: "FAILED",
      publishError: "broker unavailable"
    });
  });

  it("opens and resolves CO2 alert using the documented sustained windows", async () => {
    const state = createRepository();
    const service = new IotService(
      state.repository,
      { publishJson: async () => undefined },
      { publish: () => undefined },
      () => fixedNow
    );

    const openOffsets = [0, 60, 120, 180, 300];
    for (const offset of openOffsets) {
      await service.processTelemetryMessage(
        telemetryTopic,
        createTelemetryPayload({
          ts: new Date(Date.UTC(2026, 3, 27, 15, 0, offset)).toISOString(),
          co2_ppm: 1101
        })
      );
    }

    const openAlert = [...state.alerts.values()][0];
    expect(openAlert).toMatchObject({
      type: "CO2",
      status: "OPEN"
    });
    expect(openAlert?.metadata).toMatchObject({
      threshold: 1000,
      latest_co2_ppm: 1101
    });

    const resolveOffsets = [360, 480];
    for (const offset of resolveOffsets) {
      await service.processTelemetryMessage(
        telemetryTopic,
        createTelemetryPayload({
          ts: new Date(Date.UTC(2026, 3, 27, 15, 0, offset)).toISOString(),
          co2_ppm: 950
        })
      );
    }

    expect([...state.alerts.values()][0]).toMatchObject({
      type: "CO2",
      status: "RESOLVED"
    });
  });

  it("opens unexpected occupancy alert within office hours when there is no active reservation", async () => {
    const state = createRepository();
    const service = new IotService(
      state.repository,
      { publishJson: async () => undefined },
      { publish: () => undefined },
      () => fixedNow
    );

    const timestamps = [
      "2026-04-27T15:00:00.000Z",
      "2026-04-27T15:05:00.000Z",
      "2026-04-27T15:10:00.000Z"
    ];

    for (const ts of timestamps) {
      await service.processTelemetryMessage(
        telemetryTopic,
        createTelemetryPayload({ ts, occupancy: 2 })
      );
    }

    expect([...state.alerts.values()][0]).toMatchObject({
      type: "OCCUPANCY_UNEXPECTED",
      status: "OPEN"
    });
  });

  it("does not open unexpected occupancy alert within office hours when there is an active reservation", async () => {
    const state = createRepository({
      hasActiveReservationAt: () => true
    });
    const service = new IotService(
      state.repository,
      { publishJson: async () => undefined },
      { publish: () => undefined },
      () => fixedNow
    );

    const timestamps = [
      "2026-04-27T15:00:00.000Z",
      "2026-04-27T15:05:00.000Z",
      "2026-04-27T15:10:00.000Z"
    ];

    for (const ts of timestamps) {
      await service.processTelemetryMessage(
        telemetryTopic,
        createTelemetryPayload({ ts, occupancy: 2 })
      );
    }

    expect(state.alerts.size).toBe(0);
  });

  it("uses the configured timezone instead of a hardcoded offset for office hours", async () => {
    const state = createRepository({
      hasActiveReservationAt: () => true,
      contextOverrides: {
        timezone: "UTC",
        officeHours: [
          {
            dayOfWeek: 1,
            opensAt: "15:00",
            closesAt: "18:00",
            isEnabled: true
          }
        ]
      }
    });
    const service = new IotService(
      state.repository,
      { publishJson: async () => undefined },
      { publish: () => undefined },
      () => fixedNow
    );

    const timestamps = [
      "2026-04-27T15:00:00.000Z",
      "2026-04-27T15:05:00.000Z",
      "2026-04-27T15:10:00.000Z"
    ];

    for (const ts of timestamps) {
      await service.processTelemetryMessage(
        telemetryTopic,
        createTelemetryPayload({ ts, occupancy: 2 })
      );
    }

    expect(state.alerts.size).toBe(0);
  });
});
