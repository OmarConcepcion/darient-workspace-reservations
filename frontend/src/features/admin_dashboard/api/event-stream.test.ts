import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../../../test/server";
import { TEST_API_BASE_URL } from "../../../test/render";
import { connectEventStream } from "./event-stream";

const buildStream = (chunks: string[]) =>
  new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    }
  });

describe("connectEventStream", () => {
  it("parses event and data lines and dispatches to handlers", async () => {
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/admin/events/stream`,
        () =>
          new HttpResponse(
            buildStream([
              ": connected\n\n",
              'event: telemetry_updated\ndata: {"space_id":"s1","avg_co2_ppm":900,"max_occupancy":3,"window_start":"2026-04-27T15:00:00.000Z","window_end":"2026-04-27T15:00:59.999Z","iot_site_id":"SITE_A","iot_office_id":"OFFICE_1"}\n\n',
              'event: alert_updated\ndata: {"alert_id":"a1","space_id":"s1","type":"CO2","status":"OPEN","started_at":"2026-04-27T15:00:00.000Z","resolved_at":null}\n\n'
            ]),
            { headers: { "Content-Type": "text/event-stream" } }
          )
      )
    );

    const telemetry = vi.fn();
    const alert = vi.fn();
    const reported = vi.fn();
    const onOpen = vi.fn();
    const controller = new AbortController();

    await connectEventStream({
      baseUrl: TEST_API_BASE_URL,
      apiKey: "test",
      signal: controller.signal,
      onOpen,
      handlers: {
        telemetry_updated: telemetry,
        alert_updated: alert,
        device_reported_updated: reported
      }
    });

    expect(onOpen).toHaveBeenCalledOnce();
    expect(telemetry).toHaveBeenCalledWith(
      expect.objectContaining({ space_id: "s1", avg_co2_ppm: 900 })
    );
    expect(alert).toHaveBeenCalledWith(
      expect.objectContaining({ alert_id: "a1", status: "OPEN" })
    );
    expect(reported).not.toHaveBeenCalled();
  });

  it("ignores comment heartbeats and reassembles split chunks", async () => {
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/admin/events/stream`,
        () =>
          new HttpResponse(
            buildStream([
              ": heartbeat\n\n",
              "event: device_reported_updated\n",
              'data: {"space_id":"s2",',
              '"sampling_interval_sec":10,"co2_alert_threshold":1000,',
              '"firmware_version":"1.0.0","reported_at":"2026-04-27T15:00:00.000Z"}\n\n'
            ]),
            { headers: { "Content-Type": "text/event-stream" } }
          )
      )
    );

    const reported = vi.fn();
    const controller = new AbortController();

    await connectEventStream({
      baseUrl: TEST_API_BASE_URL,
      apiKey: "test",
      signal: controller.signal,
      handlers: { device_reported_updated: reported }
    });

    expect(reported).toHaveBeenCalledWith(
      expect.objectContaining({
        space_id: "s2",
        firmware_version: "1.0.0"
      })
    );
  });

  it("throws on non-2xx responses", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/admin/events/stream`, () =>
        HttpResponse.json(
          {
            error: { code: "UNAUTHORIZED", message: "missing api key", details: {} }
          },
          { status: 401 }
        )
      )
    );

    const controller = new AbortController();
    await expect(
      connectEventStream({
        baseUrl: TEST_API_BASE_URL,
        apiKey: "",
        signal: controller.signal,
        handlers: {}
      })
    ).rejects.toThrow(/SSE connection failed/);
  });
});
