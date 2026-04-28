import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { server } from "../../../test/server";
import { TEST_API_BASE_URL, renderWithProviders } from "../../../test/render";
import { SpaceDetailView } from "./SpaceDetailView";

const SPACE_ID = "11111111-1111-1111-1111-111111111111";
const PLACE_ID = "22222222-2222-2222-2222-222222222222";

describe("SpaceDetailView", () => {
  it("renders the space details with the resolved place", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/spaces/${SPACE_ID}`, () =>
        HttpResponse.json({
          id: SPACE_ID,
          place_id: PLACE_ID,
          iot_office_id: "OFFICE_1",
          name: "Sky Room",
          location_reference: "Floor 3",
          capacity: 8,
          description: "Glass-walled meeting room.",
          created_at: "2026-04-27T10:00:00.000Z",
          updated_at: "2026-04-27T10:00:00.000Z"
        })
      ),
      http.get(`${TEST_API_BASE_URL}/places/${PLACE_ID}`, () =>
        HttpResponse.json({
          id: PLACE_ID,
          iot_site_id: "SITE_A",
          name: "Headquarters",
          latitude: 8.98,
          longitude: -79.51,
          timezone: "America/Panama",
          created_at: "2026-04-27T10:00:00.000Z",
          updated_at: "2026-04-27T10:00:00.000Z"
        })
      ),
      http.get(`${TEST_API_BASE_URL}/spaces/${SPACE_ID}/availability`, () =>
        HttpResponse.json({
          space_id: SPACE_ID,
          date: "2026-04-27",
          timezone: "America/Panama",
          office_hours: {
            opens_at: "08:00",
            closes_at: "18:00",
            is_enabled: true
          },
          reserved_windows: [
            {
              reservation_id: "33333333-3333-3333-3333-333333333333",
              starts_at: "2026-04-27T14:00:00.000Z",
              ends_at: "2026-04-27T15:00:00.000Z"
            }
          ],
          available_windows: [
            {
              starts_at: "2026-04-27T13:00:00.000Z",
              ends_at: "2026-04-27T14:00:00.000Z"
            },
            {
              starts_at: "2026-04-27T15:00:00.000Z",
              ends_at: "2026-04-27T23:00:00.000Z"
            }
          ]
        })
      )
    );

    renderWithProviders(
      <Routes>
        <Route path="/spaces/:space_id" element={<SpaceDetailView />} />
      </Routes>,
      { router: { initialEntries: [`/spaces/${SPACE_ID}`] } }
    );

    expect(
      await screen.findByRole("heading", { name: "Sky Room" })
    ).toBeInTheDocument();
    expect((await screen.findAllByText("Headquarters")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Floor 3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("OFFICE_1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("America/Panama").length).toBeGreaterThan(0);
    expect(await screen.findByText("Disponibilidad diaria")).toBeInTheDocument();
    expect(screen.getAllByText("Reservado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Disponible").length).toBeGreaterThan(0);
  });

  it("renders the error state when the space is missing", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/spaces/${SPACE_ID}`, () =>
        HttpResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Space not found.",
              details: {}
            }
          },
          { status: 404 }
        )
      )
    );

    renderWithProviders(
      <Routes>
        <Route path="/spaces/:space_id" element={<SpaceDetailView />} />
      </Routes>,
      { router: { initialEntries: [`/spaces/${SPACE_ID}`] } }
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("No se encontró el recurso solicitado.");
  });
});
