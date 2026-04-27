import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../../../test/server";
import { TEST_API_BASE_URL, renderWithProviders } from "../../../test/render";
import { AdminOverviewView } from "./AdminOverviewView";

const PLACE_ID = "22222222-2222-2222-2222-222222222222";
const SPACE_ID = "11111111-1111-1111-1111-111111111111";

describe("AdminOverviewView", () => {
  it("renders the spaces grid with admin links", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json({
          data: [
            {
              id: SPACE_ID,
              place_id: PLACE_ID,
              iot_office_id: "OFFICE_1",
              name: "Focus Room",
              location_reference: "Floor 2",
              capacity: 4,
              description: "Quiet space.",
              created_at: "2026-04-27T10:00:00.000Z",
              updated_at: "2026-04-27T10:00:00.000Z"
            }
          ]
        })
      ),
      http.get(`${TEST_API_BASE_URL}/places`, () =>
        HttpResponse.json({
          data: [
            {
              id: PLACE_ID,
              iot_site_id: "SITE_A",
              name: "Headquarters",
              latitude: 8.98,
              longitude: -79.51,
              timezone: "America/Panama",
              created_at: "2026-04-27T10:00:00.000Z",
              updated_at: "2026-04-27T10:00:00.000Z"
            }
          ]
        })
      ),
      http.get(`${TEST_API_BASE_URL}/reservations`, () =>
        HttpResponse.json({
          data: [],
          pagination: { page: 1, page_size: 1, total: 0 }
        })
      )
    );

    renderWithProviders(<AdminOverviewView />);

    expect(await screen.findByText("Focus Room")).toBeInTheDocument();
    expect(screen.getByText("Headquarters")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open dashboard/i })
    ).toHaveAttribute("href", `/admin/spaces/${SPACE_ID}`);
  });

  it("shows the empty state when there are no spaces", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json({ data: [] })
      ),
      http.get(`${TEST_API_BASE_URL}/places`, () =>
        HttpResponse.json({ data: [] })
      ),
      http.get(`${TEST_API_BASE_URL}/reservations`, () =>
        HttpResponse.json({
          data: [],
          pagination: { page: 1, page_size: 1, total: 0 }
        })
      )
    );

    renderWithProviders(<AdminOverviewView />);

    expect(await screen.findByText("No spaces to monitor")).toBeInTheDocument();
  });
});
