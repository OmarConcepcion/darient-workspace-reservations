import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../../../test/server";
import { TEST_API_BASE_URL, renderWithProviders } from "../../../test/render";
import { SpacesListView } from "./SpacesListView";

const SPACE_ID = "11111111-1111-1111-1111-111111111111";
const PLACE_ID = "22222222-2222-2222-2222-222222222222";

const placeFixture = {
  id: PLACE_ID,
  iot_site_id: "SITE_A",
  name: "Headquarters",
  latitude: 8.98,
  longitude: -79.51,
  timezone: "America/Panama",
  created_at: "2026-04-27T10:00:00.000Z",
  updated_at: "2026-04-27T10:00:00.000Z"
};

const spaceFixture = {
  id: SPACE_ID,
  place_id: PLACE_ID,
  iot_office_id: "OFFICE_1",
  name: "Sky Room",
  location_reference: "Floor 3",
  capacity: 8,
  description: "Glass-walled meeting room.",
  created_at: "2026-04-27T10:00:00.000Z",
  updated_at: "2026-04-27T10:00:00.000Z"
};

describe("SpacesListView", () => {
  it("renders spaces with their place name", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json({ data: [spaceFixture] })
      ),
      http.get(`${TEST_API_BASE_URL}/places`, () =>
        HttpResponse.json({ data: [placeFixture] })
      )
    );

    renderWithProviders(<SpacesListView />);

    expect(await screen.findByText("Sky Room")).toBeInTheDocument();
    expect(screen.getByText("Headquarters")).toBeInTheDocument();
    expect(screen.getByText(/Capacity 8/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View details/i })).toHaveAttribute(
      "href",
      `/spaces/${SPACE_ID}`
    );
  });

  it("shows the empty state when no spaces exist", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json({ data: [] })
      ),
      http.get(`${TEST_API_BASE_URL}/places`, () =>
        HttpResponse.json({ data: [] })
      )
    );

    renderWithProviders(<SpacesListView />);

    expect(await screen.findByText("No spaces yet")).toBeInTheDocument();
  });

  it("surfaces normalized backend errors", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json(
          {
            error: {
              code: "INTERNAL_ERROR",
              message: "Spaces service unavailable.",
              details: {}
            }
          },
          { status: 500 }
        )
      ),
      http.get(`${TEST_API_BASE_URL}/places`, () =>
        HttpResponse.json({ data: [] })
      )
    );

    renderWithProviders(<SpacesListView />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Spaces service unavailable.");
  });
});
