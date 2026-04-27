import { PrismaClient } from "@prisma/client";
import mqtt from "mqtt";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const apiBaseUrl = process.env.REAL_API_URL ?? "http://localhost:3000/api/v1";
const apiKey = process.env.REAL_API_KEY ?? "darient_dev_key";
const databaseUrl =
  process.env.REAL_DATABASE_URL ??
  "postgresql://darient:darient@localhost:5432/darient?schema=core";
const mqttUrl = process.env.REAL_MQTT_URL ?? "mqtt://localhost:1883";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

type MonitoringResponse = {
  space_id: string;
  iot_site_id: string;
  iot_office_id: string;
  latest_telemetry: {
    window_start: string;
    avg_co2_ppm: number;
    sample_count: number;
  } | null;
  device_desired: {
    sampling_interval_sec: number;
    co2_alert_threshold: number;
    publish_status: string;
    last_published_at: string | null;
  } | null;
  device_reported: {
    sampling_interval_sec: number;
    co2_alert_threshold: number;
    firmware_version: string;
    reported_at: string;
  } | null;
  active_alerts: Array<{
    alert_id: string;
    type: string;
    status: string;
  }>;
};

type SseEvent = {
  event: string;
  data: Record<string, unknown>;
};

type SseSubscription = {
  events: SseEvent[];
  close: () => void;
};

const headers = {
  "x-api-key": apiKey,
  "content-type": "application/json"
};

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
};

const waitFor = async <T>(
  callback: () => Promise<T | null> | T | null,
  timeoutMs = 20_000,
  intervalMs = 250
): Promise<T> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const value = await callback();

    if (value !== null) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Timed out waiting for integration condition.");
};

const createMqttPublisher = async () => {
  const client = mqtt.connect(mqttUrl);

  await new Promise<void>((resolve, reject) => {
    client.once("connect", () => resolve());
    client.once("error", (error) => reject(error));
  });

  return {
    publish: async (topic: string, payload: Record<string, unknown>) => {
      await new Promise<void>((resolve, reject) => {
        client.publish(topic, JSON.stringify(payload), {}, (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        client.end(false, {}, (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  };
};

const openSseStream = async (): Promise<SseSubscription> => {
  const controller = new AbortController();
  const response = await fetch(`${apiBaseUrl}/admin/events/stream`, {
    headers: {
      "x-api-key": apiKey
    },
    signal: controller.signal
  });

  if (!response.ok || !response.body) {
    throw new Error(`Unable to open SSE stream: ${response.status}`);
  }

  const events: SseEvent[] = [];
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  void (async () => {
    try {
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const lines = chunk
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
          const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
          const dataLine = lines.find((line) => line.startsWith("data:"))?.slice(5).trim();

          if (!event || !dataLine) {
            continue;
          }

          events.push({
            event,
            data: JSON.parse(dataLine) as Record<string, unknown>
          });
        }
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        throw error;
      }
    }
  })();

  return {
    events,
    close: () => controller.abort()
  };
};

describe("real IoT integration", () => {
  let publisher: Awaited<ReturnType<typeof createMqttPublisher>>;

  beforeAll(async () => {
    publisher = await createMqttPublisher();
  });

  afterAll(async () => {
    await publisher.close();
    await prisma.$disconnect();
  });

  it("processes telemetry and reported payloads into db and monitoring endpoints", async () => {
    const spaces = await fetchJson<{
      data: Array<{ id: string; iot_office_id: string; place_id: string }>;
    }>("/spaces");
    const officeOne = spaces.data.find((space) => space.iot_office_id === "OFFICE_1");

    expect(officeOne).toBeDefined();

    const monitoringBefore = await fetchJson<MonitoringResponse>(
      `/admin/spaces/${officeOne!.id}/monitoring`
    );
    const beforeRawCount = await prisma.rawTelemetry.count({
      where: {
        siteId: "SITE_A",
        officeId: "OFFICE_1"
      }
    });

    const timestamp = new Date().toISOString();
    await publisher.publish("sites/SITE_A/offices/OFFICE_1/telemetry", {
      ts: timestamp,
      temp_c: 25.3,
      humidity_pct: 47.1,
      co2_ppm: 915,
      occupancy: 2,
      power_w: 130
    });
    await publisher.publish("sites/SITE_A/offices/OFFICE_1/reported", {
      ts: timestamp,
      samplingIntervalSec: 12,
      co2_alert_threshold: 975,
      firmwareVersion: "1.0.1-test"
    });

    await waitFor(async () => {
      const rawCount = await prisma.rawTelemetry.count({
        where: {
          siteId: "SITE_A",
          officeId: "OFFICE_1"
        }
      });

      return rawCount >= beforeRawCount + 1 ? rawCount : null;
    });

    const reportedRecord = await waitFor(async () => {
      const record = await prisma.deviceReported.findFirst({
        where: {
          spaceId: officeOne!.id,
          firmwareVersion: "1.0.1-test"
        }
      });

      return record ?? null;
    });

    const monitoringAfter = await waitFor(async () => {
      const snapshot = await fetchJson<MonitoringResponse>(
        `/admin/spaces/${officeOne!.id}/monitoring`
      );

      return snapshot.device_reported?.firmware_version === "1.0.1-test" ? snapshot : null;
    });

    expect(monitoringBefore.space_id).toBe(officeOne!.id);
    expect(reportedRecord).toMatchObject({
      samplingIntervalSec: 12,
      co2AlertThreshold: 975,
      firmwareVersion: "1.0.1-test"
    });
    expect(monitoringAfter.latest_telemetry?.avg_co2_ppm).toBeGreaterThan(0);
    expect(monitoringAfter.device_reported).toMatchObject({
      sampling_interval_sec: 12,
      co2_alert_threshold: 975,
      firmware_version: "1.0.1-test"
    });
  });

  it("covers desired -> simulator reported -> db -> sse and contract alert flow", async () => {
    const spaces = await fetchJson<{
      data: Array<{ id: string; iot_office_id: string }>;
    }>("/spaces");
    const officeOne = spaces.data.find((space) => space.iot_office_id === "OFFICE_1");
    const officeTwo = spaces.data.find((space) => space.iot_office_id === "OFFICE_2");

    expect(officeOne).toBeDefined();
    expect(officeTwo).toBeDefined();

    const sse = await openSseStream();
    const nextDesired = {
      sampling_interval_sec: 11,
      co2_alert_threshold: 890
    };

    const desiredResponse = await fetchJson<{
      sampling_interval_sec: number;
      co2_alert_threshold: number;
      publish_status: string;
    }>(`/admin/spaces/${officeOne!.id}/device_desired`, {
      method: "PATCH",
      body: JSON.stringify(nextDesired)
    });

    expect(desiredResponse).toMatchObject({
      sampling_interval_sec: 11,
      co2_alert_threshold: 890,
      publish_status: "PUBLISHED"
    });

    const reportedEvent = await waitFor(() => {
      const event = sse.events.find(
        (entry) =>
          entry.event === "device_reported_updated" &&
          entry.data.space_id === officeOne!.id &&
          entry.data.co2_alert_threshold === 890
      );

      return event ?? null;
    }, 30_000);

    const desiredRow = await waitFor(async () => {
      const record = await prisma.deviceDesired.findUnique({
        where: { spaceId: officeOne!.id }
      });

      return record?.publishStatus === "PUBLISHED" &&
        record.co2AlertThreshold === 890 &&
        record.samplingIntervalSec === 11
        ? record
        : null;
    });

    const now = Date.now();
    const openSeries = [0, 60_000, 120_000, 180_000, 300_000];
    for (const offset of openSeries) {
      await publisher.publish("sites/SITE_A/offices/OFFICE_2/telemetry", {
        ts: new Date(now + offset).toISOString(),
        temp_c: 24,
        humidity_pct: 45,
        co2_ppm: 1101,
        occupancy: 3,
        power_w: 125
      });
    }

    const openAlert = await waitFor(async () => {
      const alert = await prisma.alert.findFirst({
        where: {
          spaceId: officeTwo!.id,
          type: "CO2",
          status: "OPEN"
        },
        orderBy: {
          startedAt: "desc"
        }
      });

      return alert ?? null;
    });

    const alertEvent = await waitFor(() => {
      const event = sse.events.find(
        (entry) =>
          entry.event === "alert_updated" &&
          entry.data.space_id === officeTwo!.id &&
          entry.data.type === "CO2" &&
          entry.data.status === "OPEN"
      );

      return event ?? null;
    });

    const resolveSeries = [360_000, 480_000];
    for (const offset of resolveSeries) {
      await publisher.publish("sites/SITE_A/offices/OFFICE_2/telemetry", {
        ts: new Date(now + offset).toISOString(),
        temp_c: 24,
        humidity_pct: 45,
        co2_ppm: 850,
        occupancy: 3,
        power_w: 125
      });
    }

    const resolvedAlert = await waitFor(async () => {
      const alert = await prisma.alert.findFirst({
        where: {
          spaceId: officeTwo!.id,
          type: "CO2",
          status: "RESOLVED"
        },
        orderBy: {
          updatedAt: "desc"
        }
      });

      return alert ?? null;
    });

    const alertsResponse = await fetchJson<{
      data: Array<{ type: string; status: string }>;
    }>(`/admin/spaces/${officeTwo!.id}/alerts`);

    sse.close();

    expect(reportedEvent.data.sampling_interval_sec).toBe(11);
    expect(desiredRow.publishStatus).toBe("PUBLISHED");
    expect(openAlert.metadata).toMatchObject({
      threshold: 1000
    });
    expect(alertEvent.data.type).toBe("CO2");
    expect(resolvedAlert.resolvedAt).not.toBeNull();
    expect(alertsResponse.data.some((alert) => alert.type === "CO2")).toBe(true);
  });
});
