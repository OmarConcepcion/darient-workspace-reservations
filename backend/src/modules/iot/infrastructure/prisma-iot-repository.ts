import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "../../../shared/prisma/prisma.js";
import type {
  AlertRecord,
  AlertType,
  DeviceDesiredRecord,
  DeviceReportedRecord,
  MonitoringSnapshot,
  OfficeHourRule,
  RawTelemetryRecord,
  SpaceTelemetryContext,
  TelemetryAggregationRecord,
  TelemetrySample
} from "../domain/iot.js";
import type { IotRepository } from "../ports/iot-repository.js";

const toOfficeHours = (
  officeHours: Array<{
    dayOfWeek: number;
    opensAt: string;
    closesAt: string;
    isEnabled: boolean;
  }>
): OfficeHourRule[] =>
  officeHours.map((officeHour) => ({
    dayOfWeek: officeHour.dayOfWeek,
    opensAt: officeHour.opensAt,
    closesAt: officeHour.closesAt,
    isEnabled: officeHour.isEnabled
  }));

const toSpaceContext = (
  space: {
    id: string;
    placeId: string;
    iotOfficeId: string;
    capacity: number;
    place: { iotSiteId: string; timezone: string };
    officeHours: Array<{
      dayOfWeek: number;
      opensAt: string;
      closesAt: string;
      isEnabled: boolean;
    }>;
  }
): SpaceTelemetryContext => ({
  spaceId: space.id,
  placeId: space.placeId,
  iotSiteId: space.place.iotSiteId,
  iotOfficeId: space.iotOfficeId,
  capacity: space.capacity,
  timezone: space.place.timezone,
  officeHours: toOfficeHours(space.officeHours)
});

const asObject = (value: Prisma.JsonValue): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export class PrismaIotRepository implements IotRepository {
  public constructor(private readonly client: PrismaClient = prisma) {}

  public async createRawTelemetry(input: {
    topic: string;
    siteId: string;
    officeId: string;
    payload: Record<string, unknown>;
    processingStatus: RawTelemetryRecord["processingStatus"];
  }): Promise<RawTelemetryRecord> {
    const record = await this.client.rawTelemetry.create({
      data: {
        topic: input.topic,
        siteId: input.siteId,
        officeId: input.officeId,
        payload: input.payload as Prisma.InputJsonValue,
        processingStatus: input.processingStatus
      }
    });

    return {
      ...record,
      payload: asObject(record.payload)
    };
  }

  public async markRawTelemetryProcessed(id: string): Promise<void> {
    await this.client.rawTelemetry.update({
      where: { id },
      data: {
        processingStatus: "PROCESSED",
        processedAt: new Date(),
        errorMessage: null
      }
    });
  }

  public async markRawTelemetryFailed(id: string, errorMessage: string): Promise<void> {
    await this.client.rawTelemetry.update({
      where: { id },
      data: {
        processingStatus: "FAILED",
        processedAt: new Date(),
        errorMessage
      }
    });
  }

  public async findSpaceContextByIotIds(
    siteId: string,
    officeId: string
  ): Promise<SpaceTelemetryContext | null> {
    const space = await this.client.space.findFirst({
      where: {
        iotOfficeId: officeId,
        place: {
          iotSiteId: siteId
        }
      },
      include: {
        place: true,
        officeHours: true
      }
    });

    return space ? toSpaceContext(space) : null;
  }

  public async findSpaceContextBySpaceId(spaceId: string): Promise<SpaceTelemetryContext | null> {
    const space = await this.client.space.findUnique({
      where: { id: spaceId },
      include: {
        place: true,
        officeHours: true
      }
    });

    return space ? toSpaceContext(space) : null;
  }

  public async upsertTelemetryAggregation(
    input: Omit<TelemetryAggregationRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<TelemetryAggregationRecord> {
    const existing = await this.getTelemetryAggregation(input.spaceId, input.windowStart);

    if (existing) {
      return (await this.client.telemetryAggregation.update({
        where: { id: existing.id },
        data: input
      })) as TelemetryAggregationRecord;
    }

    return (await this.client.telemetryAggregation.create({
      data: input
    })) as TelemetryAggregationRecord;
  }

  public async getTelemetryAggregation(
    spaceId: string,
    windowStart: Date
  ): Promise<TelemetryAggregationRecord | null> {
    const record = await this.client.telemetryAggregation.findFirst({
      where: {
        spaceId,
        windowStart
      }
    });

    return record as TelemetryAggregationRecord | null;
  }

  public async listRecentTelemetrySamples(
    siteId: string,
    officeId: string,
    since: Date
  ): Promise<TelemetrySample[]> {
    const rows = await this.client.rawTelemetry.findMany({
      where: {
        siteId,
        officeId,
        receivedAt: {
          gte: since
        },
        processingStatus: {
          in: ["RECEIVED", "PROCESSED"]
        }
      },
      orderBy: {
        receivedAt: "asc"
      }
    });

    return rows
      .map((row) => {
        const payload = asObject(row.payload);
        const ts = payload.ts;
        const tempC = payload.temp_c;
        const humidityPct = payload.humidity_pct;
        const co2Ppm = payload.co2_ppm;
        const occupancy = payload.occupancy;
        const powerW = payload.power_w;

        if (
          typeof ts !== "string" ||
          typeof tempC !== "number" ||
          typeof humidityPct !== "number" ||
          typeof co2Ppm !== "number" ||
          typeof occupancy !== "number" ||
          typeof powerW !== "number"
        ) {
          return null;
        }

        return {
          topic: row.topic,
          siteId: row.siteId,
          officeId: row.officeId,
          timestamp: new Date(ts),
          tempC,
          humidityPct,
          co2Ppm,
          occupancy,
          powerW
        } satisfies TelemetrySample;
      })
      .filter((sample): sample is TelemetrySample => sample !== null);
  }

  public async appendTelemetrySample(_sample: TelemetrySample): Promise<void> {
    return;
  }

  public async getDeviceDesiredBySpaceId(spaceId: string): Promise<DeviceDesiredRecord | null> {
    const record = await this.client.deviceDesired.findUnique({
      where: { spaceId }
    });

    return record as DeviceDesiredRecord | null;
  }

  public async upsertDeviceDesired(input: {
    spaceId: string;
    samplingIntervalSec: number;
    co2AlertThreshold: number;
    publishStatus: DeviceDesiredRecord["publishStatus"];
    lastPublishedAt: Date | null;
    publishError: string | null;
  }): Promise<DeviceDesiredRecord> {
    return (await this.client.deviceDesired.upsert({
      where: { spaceId: input.spaceId },
      update: input,
      create: input
    })) as DeviceDesiredRecord;
  }

  public async upsertDeviceReported(input: {
    spaceId: string;
    samplingIntervalSec: number;
    co2AlertThreshold: number;
    firmwareVersion: string;
    reportedAt: Date;
  }): Promise<DeviceReportedRecord> {
    return (await this.client.deviceReported.upsert({
      where: { spaceId: input.spaceId },
      update: input,
      create: input
    })) as DeviceReportedRecord;
  }

  public async getDeviceReportedBySpaceId(spaceId: string): Promise<DeviceReportedRecord | null> {
    const record = await this.client.deviceReported.findUnique({
      where: { spaceId }
    });

    return record as DeviceReportedRecord | null;
  }

  public async getAlertBySpaceIdAndType(
    spaceId: string,
    type: AlertType
  ): Promise<AlertRecord | null> {
    const alert = await this.client.alert.findFirst({
      where: { spaceId, type },
      orderBy: { startedAt: "desc" }
    });

    return alert
      ? { ...alert, metadata: alert.metadata ? asObject(alert.metadata) : null }
      : null;
  }

  public async createAlert(input: {
    spaceId: string;
    type: AlertType;
    status: AlertRecord["status"];
    startedAt: Date;
    resolvedAt: Date | null;
    metadata: Record<string, unknown> | null;
  }): Promise<AlertRecord> {
    const alert = await this.client.alert.create({
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      }
    });

    return { ...alert, metadata: alert.metadata ? asObject(alert.metadata) : null };
  }

  public async updateAlert(
    id: string,
    input: Partial<Pick<AlertRecord, "status" | "resolvedAt" | "metadata">>
  ): Promise<AlertRecord | null> {
    const result = await this.client.alert.updateManyAndReturn({
      where: { id },
      data: {
        ...input,
        metadata:
          input.metadata !== undefined
            ? (input.metadata as Prisma.InputJsonValue)
            : undefined
      }
    });
    const alert = result[0];

    return alert
      ? { ...alert, metadata: alert.metadata ? asObject(alert.metadata) : null }
      : null;
  }

  public async listAlertsBySpaceId(spaceId: string): Promise<AlertRecord[]> {
    const alerts = await this.client.alert.findMany({
      where: { spaceId },
      orderBy: { startedAt: "desc" }
    });

    return alerts.map((alert) => ({
      ...alert,
      metadata: alert.metadata ? asObject(alert.metadata) : null
    }));
  }

  public async hasActiveReservationAt(spaceId: string, at: Date): Promise<boolean> {
    const count = await this.client.reservation.count({
      where: {
        spaceId,
        status: "ACTIVE",
        startsAt: {
          lte: at
        },
        endsAt: {
          gt: at
        }
      }
    });

    return count > 0;
  }

  public async getMonitoringSnapshot(spaceId: string): Promise<MonitoringSnapshot | null> {
    const context = await this.findSpaceContextBySpaceId(spaceId);

    if (!context) {
      return null;
    }

    const [latestAggregation, deviceDesired, deviceReported, activeAlerts] =
      await Promise.all([
        this.client.telemetryAggregation.findFirst({
          where: { spaceId },
          orderBy: { windowStart: "desc" }
        }),
        this.client.deviceDesired.findUnique({ where: { spaceId } }),
        this.client.deviceReported.findUnique({ where: { spaceId } }),
        this.client.alert.findMany({
          where: { spaceId, status: "OPEN" },
          orderBy: { startedAt: "desc" }
        })
      ]);

    return {
      space: context,
      latestAggregation: latestAggregation as TelemetryAggregationRecord | null,
      deviceDesired: deviceDesired as DeviceDesiredRecord | null,
      deviceReported: deviceReported as DeviceReportedRecord | null,
      activeAlerts: activeAlerts.map((alert) => ({
        ...alert,
        metadata: alert.metadata ? asObject(alert.metadata) : null
      }))
    };
  }
}
