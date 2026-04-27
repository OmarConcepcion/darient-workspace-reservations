import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "../../../test/server";
import { TEST_API_BASE_URL, renderWithProviders } from "../../../test/render";
import { SpaceMonitoringView } from "./SpaceMonitoringView";

const SPACE_ID = "11111111-1111-1111-1111-111111111111";

const monitoringFixture = {
  space_id: SPACE_ID,
  iot_site_id: "SITE_A",
  iot_office_id: "OFFICE_1",
  capacity: 4,
  timezone: "America/Panama",
  office_hours: [],
  latest_telemetry: {
    window_start: "2026-04-27T15:10:00.000Z",
    window_end: "2026-04-27T15:10:59.999Z",
    avg_temp_c: 24.1,
    avg_humidity_pct: 49.3,
    avg_co2_ppm: 930,
    max_co2_ppm: 950,
    avg_occupancy: 4,
    max_occupancy: 4,
    latest_power_w: 120,
    sample_count: 1
  },
  device_desired: {
    sampling_interval_sec: 10,
    co2_alert_threshold: 1000,
    publish_status: "PUBLISHED",
    last_published_at: "2026-04-27T14:00:00.000Z",
    publish_error: null
  },
  device_reported: {
    sampling_interval_sec: 10,
    co2_alert_threshold: 1000,
    firmware_version: "1.0.0",
    reported_at: "2026-04-27T15:00:00.000Z"
  },
  active_alerts: [
    {
      alert_id: "a1111111-1111-1111-1111-111111111111",
      space_id: SPACE_ID,
      type: "CO2",
      status: "OPEN",
      started_at: "2026-04-27T15:00:00.000Z",
      resolved_at: null,
      metadata: { latest_co2_ppm: 1100 }
    }
  ]
};

const alertsFixture = [
  {
    alert_id: "a1111111-1111-1111-1111-111111111111",
    space_id: SPACE_ID,
    type: "CO2",
    status: "OPEN",
    started_at: "2026-04-27T15:00:00.000Z",
    resolved_at: null,
    metadata: { latest_co2_ppm: 1100 }
  }
];

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args)
  }
}));

const openSseStream = () =>
  http.get(`${TEST_API_BASE_URL}/admin/events/stream`, () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(": connected\n\n"));
      }
    });
    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/event-stream" }
    });
  });

beforeEach(() => {
  toastSuccess.mockReset();
  toastError.mockReset();

  server.use(
    http.get(
      `${TEST_API_BASE_URL}/admin/spaces/${SPACE_ID}/monitoring`,
      () => HttpResponse.json(monitoringFixture)
    ),
    http.get(`${TEST_API_BASE_URL}/admin/spaces/${SPACE_ID}/alerts`, () =>
      HttpResponse.json({ data: alertsFixture })
    ),
    openSseStream()
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

const renderView = () =>
  renderWithProviders(
    <Routes>
      <Route
        path="/admin/spaces/:space_id"
        element={<SpaceMonitoringView />}
      />
    </Routes>,
    { router: { initialEntries: [`/admin/spaces/${SPACE_ID}`] } }
  );

describe("SpaceMonitoringView", () => {
  it("renders telemetry stats, device state and alerts", async () => {
    renderView();

    expect(await screen.findByText("Avg CO₂")).toBeInTheDocument();
    expect(screen.getByText("930 ppm")).toBeInTheDocument();
    expect(screen.getByText("Max 950 ppm")).toBeInTheDocument();
    expect(screen.getByText("4 / 4")).toBeInTheDocument();
    expect(screen.getByText("24.1 °C")).toBeInTheDocument();
    expect(screen.getByText("120 W")).toBeInTheDocument();

    expect(screen.getByText("Device state")).toBeInTheDocument();
    expect(screen.getAllByText("Published").length).toBeGreaterThan(0);
    expect(screen.getByText("1.0.0")).toBeInTheDocument();

    expect(screen.getByText("Alerts")).toBeInTheDocument();
    expect(screen.getByText("CO₂")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();

    expect(
      screen.getByText("1 active alert")
    ).toBeInTheDocument();
  });

  it("publishes a desired-state update and toasts on success", async () => {
    let publishedBody: Record<string, unknown> | null = null;

    server.use(
      http.patch(
        `${TEST_API_BASE_URL}/admin/spaces/${SPACE_ID}/device_desired`,
        async ({ request }) => {
          publishedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({
            sampling_interval_sec: publishedBody.sampling_interval_sec,
            co2_alert_threshold: publishedBody.co2_alert_threshold,
            publish_status: "PUBLISHED",
            last_published_at: "2026-04-27T15:30:00.000Z",
            publish_error: null
          });
        }
      )
    );

    const user = userEvent.setup();
    renderView();

    const samplingInput = await screen.findByLabelText(
      "Sampling interval (seconds)"
    );
    const thresholdInput = screen.getByLabelText("CO₂ alert threshold (ppm)");

    await user.clear(samplingInput);
    await user.type(samplingInput, "20");
    await user.clear(thresholdInput);
    await user.type(thresholdInput, "900");

    await user.click(screen.getByRole("button", { name: "Publish update" }));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        "Desired state updated and published."
      )
    );
    expect(publishedBody).toEqual({
      sampling_interval_sec: 20,
      co2_alert_threshold: 900
    });
  });

  it("toasts when the desired update fails with a backend error", async () => {
    server.use(
      http.patch(
        `${TEST_API_BASE_URL}/admin/spaces/${SPACE_ID}/device_desired`,
        () =>
          HttpResponse.json(
            {
              error: {
                code: "MQTT_PUBLISH_FAILED",
                message: "Broker unavailable.",
                details: {}
              }
            },
            { status: 502 }
          )
      )
    );

    const user = userEvent.setup();
    renderView();

    const samplingInput = await screen.findByLabelText(
      "Sampling interval (seconds)"
    );
    await user.clear(samplingInput);
    await user.type(samplingInput, "30");

    await user.click(screen.getByRole("button", { name: "Publish update" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Broker unavailable.")
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
