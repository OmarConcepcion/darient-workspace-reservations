import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

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

const createRepository = () => {
  const rawTelemetry = new Map<string, RawTelemetryRecord>();
  const telemetrySamples: TelemetrySample[] = [];
  const aggregations = new Map<string, TelemetryAggregationRecord>();
  const alerts = new Map<string, AlertRecord>();
  const desiredBySpaceId = new Map<string, DeviceDesiredRecord>([
    [
      context.spaceId,
      {
        id: randomUUID(),
        spaceId: context.spaceId,
        samplingIntervalSec: 10,
        co2AlertThreshold: 1000,
        publishStatus: "PENDING",
        lastPublishedAt: null,
        publishError: null,
        createdAt: fixedNow,
        updatedAt: fixedNow
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
      siteId === context.iotSiteId && officeId === context.iotOfficeId
        ? context
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
    hasActiveReservationAt: async () => false,
    getMonitoringSnapshot: async (spaceId) => {
      const latestAggregation = [...aggregations.values()]
        .filter((aggregation) => aggregation.spaceId === spaceId)
        .sort((left, right) => right.windowStart.getTime() - left.windowStart.getTime())[0] ??
        null;

      return {
        space: context,
        latestAggregation,
        deviceDesired: desiredBySpaceId.get(spaceId) ?? null,
        deviceReported: reportedBySpaceId.get(spaceId) ?? null,
        activeAlerts: [...alerts.values()].filter(
          (alert) => alert.spaceId === spaceId && alert.status === "OPEN"
        )
      } satisfies MonitoringSnapshot;
    },
    findSpaceContextBySpaceId: async (spaceId) =>
      spaceId === context.spaceId ? context : null
  };

  return {
    repository,
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
      "sites/SITE_A/offices/OFFICE_1/telemetry",
      JSON.stringify({
        ts: "2026-04-27T15:10:00.000Z",
        temp_c: 24.1,
        humidity_pct: 49.3,
        co2_ppm: 1100,
        occupancy: 5,
        power_w: 120
      })
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
      "sites/SITE_A/offices/OFFICE_1/reported",
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
    expect(sseEvents.at(-1)?.event).toBe("device_desired_updated");
  });
});
