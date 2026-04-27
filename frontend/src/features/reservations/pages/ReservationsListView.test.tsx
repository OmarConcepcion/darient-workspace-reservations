import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "../../../test/server";
import { TEST_API_BASE_URL, renderWithProviders } from "../../../test/render";
import { ReservationsListView } from "./ReservationsListView";

const SPACE_ID = "11111111-1111-1111-1111-111111111111";
const PLACE_ID = "22222222-2222-2222-2222-222222222222";
const RESERVATION_ID = "33333333-3333-3333-3333-333333333333";

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

const reservationFixture = {
  id: RESERVATION_ID,
  place_id: PLACE_ID,
  space_id: SPACE_ID,
  customer_email: "alice@example.com",
  starts_at: "2026-05-01T15:00:00.000Z",
  ends_at: "2026-05-01T16:00:00.000Z",
  status: "ACTIVE" as const,
  cancelled_at: null,
  created_at: "2026-04-27T10:00:00.000Z",
  updated_at: "2026-04-27T10:00:00.000Z"
};

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args)
  }
}));

beforeEach(() => {
  toastSuccess.mockReset();
  toastError.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ReservationsListView", () => {
  it("renders reservations with their space name", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/reservations`, () =>
        HttpResponse.json({
          data: [reservationFixture],
          pagination: { page: 1, page_size: 10, total: 1 }
        })
      ),
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json({ data: [spaceFixture] })
      )
    );

    renderWithProviders(<ReservationsListView />);

    expect(await screen.findByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Sky Room")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeInTheDocument();
  });

  it("shows the empty state when no reservations exist", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/reservations`, () =>
        HttpResponse.json({
          data: [],
          pagination: { page: 1, page_size: 10, total: 0 }
        })
      ),
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json({ data: [] })
      )
    );

    renderWithProviders(<ReservationsListView />);

    expect(await screen.findByText("No reservations yet")).toBeInTheDocument();
  });

  it("surfaces normalized backend errors", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/reservations`, () =>
        HttpResponse.json(
          {
            error: {
              code: "INTERNAL_ERROR",
              message: "Reservations service is down.",
              details: {}
            }
          },
          { status: 500 }
        )
      ),
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json({ data: [] })
      )
    );

    renderWithProviders(<ReservationsListView />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Reservations service is down."
    );
  });

  it("cancels an active reservation and shows a success toast", async () => {
    let cancelHits = 0;

    server.use(
      http.get(`${TEST_API_BASE_URL}/reservations`, () =>
        HttpResponse.json({
          data: [reservationFixture],
          pagination: { page: 1, page_size: 10, total: 1 }
        })
      ),
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json({ data: [spaceFixture] })
      ),
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
    renderWithProviders(<ReservationsListView />);

    const cancelButton = await screen.findByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    await waitFor(() => expect(cancelHits).toBe(1));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Reservation cancelled.")
    );
    expect(toastError).not.toHaveBeenCalled();
  });

  it("shows an error toast when cancelling fails", async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/reservations`, () =>
        HttpResponse.json({
          data: [reservationFixture],
          pagination: { page: 1, page_size: 10, total: 1 }
        })
      ),
      http.get(`${TEST_API_BASE_URL}/spaces`, () =>
        HttpResponse.json({ data: [spaceFixture] })
      ),
      http.patch(
        `${TEST_API_BASE_URL}/reservations/${RESERVATION_ID}/cancel`,
        () =>
          HttpResponse.json(
            {
              error: {
                code: "CONFLICT",
                message: "Reservation already cancelled.",
                details: {}
              }
            },
            { status: 409 }
          )
      )
    );

    const user = userEvent.setup();
    renderWithProviders(<ReservationsListView />);

    const cancelButton = await screen.findByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Reservation already cancelled.")
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
