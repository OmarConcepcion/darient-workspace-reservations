import { z } from "zod";

import { AppError } from "../../../shared/errors/app-error.js";
import type {
  AlertRecord,
  AlertType,
  DeviceDesiredInput,
  DeviceDesiredRecord,
  MonitoringSnapshot,
  SpaceTelemetryContext,
  TelemetryAggregationRecord,
  TelemetrySample
} from "../domain/iot.js";
import type { IotRepository } from "../ports/iot-repository.js";
import type { MqttPublisher } from "../ports/mqtt-publisher.js";
import type { SsePublisher } from "../ports/sse-publisher.js";
import { parseIotTopic } from "./topic-parser.js";

const telemetryPayloadSchema = z.object({
  ts: z.string().datetime(),
  temp_c: z.number(),
  humidity_pct: z.number(),
  co2_ppm: z.number().int(),
  occupancy: z.number().int(),
  power_w: z.number().int()
});

const reportedPayloadSchema = z.object({
  ts: z.string().datetime(),
  samplingIntervalSec: z.number().int().positive(),
  co2_alert_threshold: z.number().int().positive(),
  firmwareVersion: z.string().min(1)
});

const desiredInputSchema = z.object({
  samplingIntervalSec: z.number().int().positive(),
  co2AlertThreshold: z.number().int().positive()
});

const minuteWindow = (date: Date) => {
  const windowStart = new Date(date);
  windowStart.setUTCSeconds(0, 0);
  const windowEnd = new Date(windowStart.getTime() + 59_999);
  return { windowStart, windowEnd };
};

const toMinutes = (minutes: number) => minutes * 60 * 1000;

export class IotService {
  public constructor(
    private readonly iotRepository: IotRepository,
    private readonly mqttPublisher: MqttPublisher,
    private readonly ssePublisher: SsePublisher,
    private readonly nowProvider: () => Date = () => new Date()
  ) {}

  public async processTelemetryMessage(topic: string, payloadText: string): Promise<void> {
    const { siteId, officeId, messageType } = parseIotTopic(topic);

    if (messageType !== "telemetry") {
      throw new AppError(400, "INVALID_IOT_TOPIC", "Telemetry topic expected.");
    }

    const rawPayload = this.parseJsonPayload(payloadText);
    const rawRecord = await this.iotRepository.createRawTelemetry({
      topic,
      siteId,
      officeId,
      payload: rawPayload,
      processingStatus: "RECEIVED"
    });

    try {
      const payload = telemetryPayloadSchema.parse(rawPayload);
      const context = await this.getSpaceContext(siteId, officeId);
      const timestamp = new Date(payload.ts);
      const sample: TelemetrySample = {
        topic,
        siteId,
        officeId,
        timestamp,
        tempC: payload.temp_c,
        humidityPct: payload.humidity_pct,
        co2Ppm: payload.co2_ppm,
        occupancy: payload.occupancy,
        powerW: payload.power_w
      };

      await this.iotRepository.appendTelemetrySample(sample);
      const aggregation = await this.upsertAggregation(context.spaceId, sample);
      await this.evaluateAlerts(context, sample);
      await this.iotRepository.markRawTelemetryProcessed(rawRecord.id);

      this.ssePublisher.publish("telemetry_updated", {
        space_id: context.spaceId,
        iot_site_id: context.iotSiteId,
        iot_office_id: context.iotOfficeId,
        avg_co2_ppm: aggregation.avgCo2Ppm,
        max_occupancy: aggregation.maxOccupancy,
        window_start: aggregation.windowStart.toISOString(),
        window_end: aggregation.windowEnd.toISOString()
      });
    } catch (error) {
      await this.iotRepository.markRawTelemetryFailed(
        rawRecord.id,
        error instanceof Error ? error.message : "Unknown telemetry processing error."
      );
      throw error;
    }
  }

  public async processReportedMessage(topic: string, payloadText: string): Promise<void> {
    const { siteId, officeId, messageType } = parseIotTopic(topic);

    if (messageType !== "reported") {
      throw new AppError(400, "INVALID_IOT_TOPIC", "Reported topic expected.");
    }

    const payload = reportedPayloadSchema.parse(this.parseJsonPayload(payloadText));
    const context = await this.getSpaceContext(siteId, officeId);
    const reported = await this.iotRepository.upsertDeviceReported({
      spaceId: context.spaceId,
      samplingIntervalSec: payload.samplingIntervalSec,
      co2AlertThreshold: payload.co2_alert_threshold,
      firmwareVersion: payload.firmwareVersion,
      reportedAt: new Date(payload.ts)
    });

    this.ssePublisher.publish("device_reported_updated", {
      space_id: context.spaceId,
      sampling_interval_sec: reported.samplingIntervalSec,
      co2_alert_threshold: reported.co2AlertThreshold,
      firmware_version: reported.firmwareVersion,
      reported_at: reported.reportedAt.toISOString()
    });
  }

  public async updateDeviceDesired(
    spaceId: string,
    input: DeviceDesiredInput
  ): Promise<DeviceDesiredRecord> {
    const parsedInput = desiredInputSchema.parse(input);
    const context = await this.iotRepository.findSpaceContextBySpaceId(spaceId);

    if (!context) {
      throw new AppError(404, "SPACE_NOT_FOUND", "Space not found.");
    }

    const topic = `sites/${context.iotSiteId}/offices/${context.iotOfficeId}/desired`;

    try {
      await this.mqttPublisher.publishJson(topic, {
        samplingIntervalSec: parsedInput.samplingIntervalSec,
        co2_alert_threshold: parsedInput.co2AlertThreshold
      });

      const desired = await this.iotRepository.upsertDeviceDesired({
        spaceId,
        samplingIntervalSec: parsedInput.samplingIntervalSec,
        co2AlertThreshold: parsedInput.co2AlertThreshold,
        publishStatus: "PUBLISHED",
        lastPublishedAt: this.nowProvider(),
        publishError: null
      });

      this.ssePublisher.publish("device_desired_updated", {
        space_id: spaceId,
        sampling_interval_sec: desired.samplingIntervalSec,
        co2_alert_threshold: desired.co2AlertThreshold,
        publish_status: desired.publishStatus,
        last_published_at: desired.lastPublishedAt?.toISOString() ?? null
      });

      return desired;
    } catch (error) {
      return this.iotRepository.upsertDeviceDesired({
        spaceId,
        samplingIntervalSec: parsedInput.samplingIntervalSec,
        co2AlertThreshold: parsedInput.co2AlertThreshold,
        publishStatus: "FAILED",
        lastPublishedAt: null,
        publishError:
          error instanceof Error ? error.message : "Failed to publish desired state."
      });
    }
  }

  public async getMonitoring(spaceId: string): Promise<MonitoringSnapshot> {
    const snapshot = await this.iotRepository.getMonitoringSnapshot(spaceId);

    if (!snapshot) {
      throw new AppError(404, "SPACE_NOT_FOUND", "Space not found.");
    }

    return snapshot;
  }

  public async listAlerts(spaceId: string): Promise<AlertRecord[]> {
    const context = await this.iotRepository.findSpaceContextBySpaceId(spaceId);

    if (!context) {
      throw new AppError(404, "SPACE_NOT_FOUND", "Space not found.");
    }

    return this.iotRepository.listAlertsBySpaceId(spaceId);
  }

  private parseJsonPayload(payloadText: string): Record<string, unknown> {
    try {
      const payload = JSON.parse(payloadText) as unknown;

      if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
        throw new Error("Payload must be a JSON object.");
      }

      return payload as Record<string, unknown>;
    } catch (error) {
      throw new AppError(
        400,
        "INVALID_IOT_PAYLOAD",
        error instanceof Error ? error.message : "Invalid JSON payload."
      );
    }
  }

  private async getSpaceContext(
    siteId: string,
    officeId: string
  ): Promise<SpaceTelemetryContext> {
    const context = await this.iotRepository.findSpaceContextByIotIds(siteId, officeId);

    if (!context) {
      throw new AppError(404, "IOT_SPACE_NOT_FOUND", "IoT space mapping not found.");
    }

    return context;
  }

  private async upsertAggregation(
    spaceId: string,
    sample: TelemetrySample
  ): Promise<TelemetryAggregationRecord> {
    const { windowStart, windowEnd } = minuteWindow(sample.timestamp);
    const current = await this.iotRepository.getTelemetryAggregation(spaceId, windowStart);

    if (!current) {
      return this.iotRepository.upsertTelemetryAggregation({
        spaceId,
        windowStart,
        windowEnd,
        avgTempC: sample.tempC,
        avgHumidityPct: sample.humidityPct,
        avgCo2Ppm: sample.co2Ppm,
        maxCo2Ppm: sample.co2Ppm,
        avgOccupancy: sample.occupancy,
        maxOccupancy: sample.occupancy,
        latestPowerW: sample.powerW,
        sampleCount: 1
      });
    }

    const nextSampleCount = current.sampleCount + 1;

    return this.iotRepository.upsertTelemetryAggregation({
      spaceId,
      windowStart,
      windowEnd,
      avgTempC: (current.avgTempC * current.sampleCount + sample.tempC) / nextSampleCount,
      avgHumidityPct:
        (current.avgHumidityPct * current.sampleCount + sample.humidityPct) /
        nextSampleCount,
      avgCo2Ppm:
        (current.avgCo2Ppm * current.sampleCount + sample.co2Ppm) /
        nextSampleCount,
      maxCo2Ppm: Math.max(current.maxCo2Ppm, sample.co2Ppm),
      avgOccupancy:
        (current.avgOccupancy * current.sampleCount + sample.occupancy) /
        nextSampleCount,
      maxOccupancy: Math.max(current.maxOccupancy, sample.occupancy),
      latestPowerW: sample.powerW,
      sampleCount: nextSampleCount
    });
  }

  private async evaluateAlerts(
    context: SpaceTelemetryContext,
    sample: TelemetrySample
  ): Promise<void> {
    const desired = await this.iotRepository.getDeviceDesiredBySpaceId(context.spaceId);
    const co2Threshold = desired?.co2AlertThreshold ?? 1000;
    const recentTenMinutes = await this.iotRepository.listRecentTelemetrySamples(
      context.iotSiteId,
      context.iotOfficeId,
      new Date(sample.timestamp.getTime() - toMinutes(10))
    );

    await this.syncAlert(
      context.spaceId,
      "CO2",
      this.isSustained(
        recentTenMinutes.filter((entry) => entry.timestamp >= new Date(sample.timestamp.getTime() - toMinutes(5))),
        5,
        (entry) => entry.co2Ppm > co2Threshold
      ),
      this.isSustained(
        recentTenMinutes.filter((entry) => entry.timestamp >= new Date(sample.timestamp.getTime() - toMinutes(2))),
        2,
        (entry) => entry.co2Ppm <= co2Threshold
      ),
      {
        threshold: co2Threshold,
        latest_co2_ppm: sample.co2Ppm
      },
      sample.timestamp
    );

    await this.syncAlert(
      context.spaceId,
      "OCCUPANCY_MAX",
      this.isSustained(
        recentTenMinutes.filter((entry) => entry.timestamp >= new Date(sample.timestamp.getTime() - toMinutes(2))),
        2,
        (entry) => entry.occupancy > context.capacity
      ),
      this.isSustained(
        recentTenMinutes.filter((entry) => entry.timestamp >= new Date(sample.timestamp.getTime() - toMinutes(1))),
        1,
        (entry) => entry.occupancy <= context.capacity
      ),
      {
        capacity: context.capacity,
        latest_occupancy: sample.occupancy
      },
      sample.timestamp
    );

    const unexpectedOpen = await this.isUnexpectedOccupancySustained(
      context,
      recentTenMinutes,
      sample.timestamp,
      10
    );
    const unexpectedResolved =
      this.isSustained(
        recentTenMinutes.filter((entry) => entry.timestamp >= new Date(sample.timestamp.getTime() - toMinutes(5))),
        5,
        (entry) => entry.occupancy === 0
      ) || !(await this.isUnexpectedOccupancy(context, sample));

    await this.syncAlert(
      context.spaceId,
      "OCCUPANCY_UNEXPECTED",
      unexpectedOpen,
      unexpectedResolved,
      {
        latest_occupancy: sample.occupancy
      },
      sample.timestamp
    );
  }

  private isSustained(
    samples: TelemetrySample[],
    requiredMinutes: number,
    predicate: (sample: TelemetrySample) => boolean
  ): boolean {
    if (samples.length === 0) {
      return false;
    }

    const sorted = [...samples].sort(
      (left, right) => left.timestamp.getTime() - right.timestamp.getTime()
    );
    const durationMs =
      sorted.at(-1)!.timestamp.getTime() - sorted[0].timestamp.getTime();

    return durationMs >= toMinutes(requiredMinutes) && sorted.every(predicate);
  }

  private async isUnexpectedOccupancySustained(
    context: SpaceTelemetryContext,
    samples: TelemetrySample[],
    now: Date,
    requiredMinutes: number
  ): Promise<boolean> {
    const relevantSamples = samples.filter(
      (sample) => sample.timestamp >= new Date(now.getTime() - toMinutes(requiredMinutes))
    );

    if (relevantSamples.length === 0) {
      return false;
    }

    const checks = await Promise.all(
      relevantSamples.map((entry) => this.isUnexpectedOccupancy(context, entry))
    );

    return (
      relevantSamples.at(-1)!.timestamp.getTime() -
        relevantSamples[0]!.timestamp.getTime() >=
        toMinutes(requiredMinutes) && checks.every(Boolean)
    );
  }

  private async isUnexpectedOccupancy(
    context: SpaceTelemetryContext,
    sample: TelemetrySample
  ): Promise<boolean> {
    if (sample.occupancy <= 0) {
      return false;
    }

    const withinOfficeHours = this.isWithinOfficeHours(context.officeHours, sample.timestamp);

    if (!withinOfficeHours) {
      return true;
    }

    const hasActiveReservation = await this.iotRepository.hasActiveReservationAt(
      context.spaceId,
      sample.timestamp
    );

    return !hasActiveReservation;
  }

  private isWithinOfficeHours(officeHours: SpaceTelemetryContext["officeHours"], at: Date): boolean {
    const panamaTime = new Date(at.getTime() - 5 * 60 * 60 * 1000);
    const dayOfWeek = panamaTime.getUTCDay();
    const rule = officeHours.find((item) => item.dayOfWeek === dayOfWeek && item.isEnabled);

    if (!rule) {
      return false;
    }

    const currentTime = `${String(panamaTime.getUTCHours()).padStart(2, "0")}:${String(
      panamaTime.getUTCMinutes()
    ).padStart(2, "0")}`;

    return currentTime >= rule.opensAt && currentTime <= rule.closesAt;
  }

  private async syncAlert(
    spaceId: string,
    type: AlertType,
    shouldOpen: boolean,
    shouldResolve: boolean,
    metadata: Record<string, unknown>,
    timestamp: Date
  ): Promise<void> {
    const existing = await this.iotRepository.getAlertBySpaceIdAndType(spaceId, type);

    if (shouldOpen && (!existing || existing.status === "RESOLVED")) {
      const alert = existing
        ? await this.iotRepository.updateAlert(existing.id, {
            status: "OPEN",
            resolvedAt: null,
            metadata
          })
        : await this.iotRepository.createAlert({
            spaceId,
            type,
            status: "OPEN",
            startedAt: timestamp,
            resolvedAt: null,
            metadata
          });

      if (alert) {
        this.publishAlert(alert);
      }
      return;
    }

    if (existing && existing.status === "OPEN" && shouldResolve) {
      const alert = await this.iotRepository.updateAlert(existing.id, {
        status: "RESOLVED",
        resolvedAt: timestamp,
        metadata
      });

      if (alert) {
        this.publishAlert(alert);
      }
    }
  }

  private publishAlert(alert: AlertRecord): void {
    this.ssePublisher.publish("alert_updated", {
      alert_id: alert.id,
      space_id: alert.spaceId,
      type: alert.type,
      status: alert.status,
      started_at: alert.startedAt.toISOString(),
      resolved_at: alert.resolvedAt?.toISOString() ?? null
    });
  }
}
