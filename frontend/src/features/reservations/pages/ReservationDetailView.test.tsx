import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "../../../test/server";
import { TEST_API_BASE_URL, renderWithProviders } from "../../../test/render";
import { ReservationDetailView } from "./ReservationDetailView";

const SPACE_ID = "11111111-1111-1111-1111-111111111111";
const PLACE_ID = "22222222-2222-2222-2222-222222222222";
const RESERVATION_ID = "33333333-3333-3333-3333-333333333333";

const reservationFixture = {
  id: RESERVATION_ID,
  place_id: PLACE_ID,
  space_id: SPACE_ID,
  customer_email: "alice@example.com",
  starts_at: "2026-05-01T15:00:00.000Z",
  ends_at: "2026-05-01T16:30:00.000Z",
  status: "ACTIVE",
  cancelled_at: null,
  created_at: "2026-04-27T10:00:00.000Z",
  updated_at: "2026-04-27T10:00:00.000Z"
};

const spaceFixture = {
  id: SPACE_ID,
  place_id: PLACE_ID,
  iot_office_id: "OFFICE_1",
  name: "Sky Room",
  location_reference: null,
  capacity: 8,
  description: null,
  created_at: "2026-04-27T10:00:00.000Z",
  updated_at: "2026-04-27T10:00:00.000Z"
};

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

const toastSuccess = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn()
  }
}));

beforeEach(() => {
  toastSuccess.mockReset();
  server.use(
    http.get(`${TEST_API_BASE_URL}/reservations/${RESERVATION_ID}`, () =>
      HttpResponse.json(reservationFixture)
    ),
    http.get(`${TEST_API_BASE_URL}/spaces/${SPACE_ID}`, () =>
      HttpResponse.json(spaceFixture)
    ),
    http.get(`${TEST_API_BASE_URL}/places/${PLACE_ID}`, () =>
      HttpResponse.json(placeFixture)
    )
  );
});

const renderDetail = () =>
  renderWithProviders(
    <Routes>
      <Route
        path="/reservations/:reservation_id"
        element={<ReservationDetailView />}
      />
      <Route
        path="/reservations"
        element={<div data-testid="reservations-list">list</div>}
      />
    </Routes>,
    { router: { initialEntries: [`/reservations/${RESERVATION_ID}`] } }
  );

describe("ReservationDetailView", () => {
  it("renders reservation details and the no-editing guidance", async () => {
    renderDetail();

    expect((await screen.findAllByText("alice@example.com")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Sky Room")).length).toBeGreaterThan(0);
    expect(await screen.findByText("Headquarters")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Reservations cannot be edited. If something is wrong, cancel this reservation and create a new one."
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText(/May 1, 2026/).length).toBeGreaterThan(0);
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("cancels an active reservation from the detail page", async () => {
    let cancelHits = 0;
    server.use(
      http.patch(
        `${TEST_API_BASE_URL}/reservations/${RESERVATION_ID}/cancel`,
        () => {
          cancelHits += 1;
          return HttpResponse.json({
            ...reservationFixture,
            status: "CANCELLED",
            cancelled_at: "2026-04-27T11:00:00.000Z"
          });
        }
      )
    );

    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Confirm cancel" }));

    await waitFor(() => expect(cancelHits).toBe(1));
    expect(toastSuccess).toHaveBeenCalledWith("Reservation cancelled.");
  });

  it("deletes a cancelled reservation from the detail page", async () => {
    let deleteHits = 0;
    server.use(
      http.get(`${TEST_API_BASE_URL}/reservations/${RESERVATION_ID}`, () =>
        HttpResponse.json({
          ...reservationFixture,
          status: "CANCELLED",
          cancelled_at: "2026-04-27T11:00:00.000Z"
        })
      ),
      http.delete(`${TEST_API_BASE_URL}/reservations/${RESERVATION_ID}`, () => {
        deleteHits += 1;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderDetail();

    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(deleteHits).toBe(1));
    expect(await screen.findByTestId("reservations-list")).toBeInTheDocument();
  });
});
