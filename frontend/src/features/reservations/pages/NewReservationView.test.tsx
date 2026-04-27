import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "../../../test/server";
import { TEST_API_BASE_URL, renderWithProviders } from "../../../test/render";
import { NewReservationView } from "./NewReservationView";

const PLACE_ID = "22222222-2222-2222-2222-222222222222";
const SPACE_ID = "11111111-1111-1111-1111-111111111111";

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
  location_reference: null,
  capacity: 8,
  description: null,
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

  server.use(
    http.get(`${TEST_API_BASE_URL}/places`, () =>
      HttpResponse.json({ data: [placeFixture] })
    ),
    http.get(`${TEST_API_BASE_URL}/spaces`, () =>
      HttpResponse.json({ data: [spaceFixture] })
    )
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

const renderForm = () =>
  renderWithProviders(
    <Routes>
      <Route path="/reservations/new" element={<NewReservationView />} />
      <Route
        path="/reservations"
        element={<div data-testid="list-page">reservations list</div>}
      />
    </Routes>,
    { router: { initialEntries: ["/reservations/new"] } }
  );

describe("NewReservationView", () => {
  it("blocks submission and surfaces inline errors when fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Headquarters" })
      ).toBeInTheDocument()
    );

    await user.click(
      screen.getByRole("button", { name: "Create reservation" })
    );

    expect(await screen.findByText("A place is required")).toBeInTheDocument();
    expect(screen.getByText("A space is required")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.getByText("Start time is required")).toBeInTheDocument();
    expect(screen.getByText("End time is required")).toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("requires the end time to be after the start time", async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Headquarters" })
      ).toBeInTheDocument()
    );

    await user.selectOptions(screen.getByLabelText("Place"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Space"), SPACE_ID);
    await user.type(
      screen.getByLabelText("Customer email"),
      "alice@example.com"
    );
    await user.type(screen.getByLabelText("Starts at"), "2026-05-01T10:00");
    await user.type(screen.getByLabelText("Ends at"), "2026-05-01T09:00");

    await user.click(
      screen.getByRole("button", { name: "Create reservation" })
    );

    expect(
      await screen.findByText("End must be after start")
    ).toBeInTheDocument();
  });

  it("creates a reservation and navigates to the list on success", async () => {
    let createBody: Record<string, unknown> | null = null;

    server.use(
      http.post(
        `${TEST_API_BASE_URL}/reservations`,
        async ({ request }) => {
          createBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            {
              id: "44444444-4444-4444-4444-444444444444",
              place_id: PLACE_ID,
              space_id: SPACE_ID,
              customer_email: createBody.customer_email,
              starts_at: createBody.starts_at,
              ends_at: createBody.ends_at,
              status: "ACTIVE",
              cancelled_at: null,
              created_at: "2026-04-27T11:00:00.000Z",
              updated_at: "2026-04-27T11:00:00.000Z"
            },
            { status: 201 }
          );
        }
      )
    );

    const user = userEvent.setup();
    renderForm();

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Headquarters" })
      ).toBeInTheDocument()
    );

    await user.selectOptions(screen.getByLabelText("Place"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Space"), SPACE_ID);
    await user.type(
      screen.getByLabelText("Customer email"),
      "alice@example.com"
    );
    await user.type(screen.getByLabelText("Starts at"), "2026-05-01T10:00");
    await user.type(screen.getByLabelText("Ends at"), "2026-05-01T11:00");

    await user.click(
      screen.getByRole("button", { name: "Create reservation" })
    );

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Reservation created.")
    );
    expect(await screen.findByTestId("list-page")).toBeInTheDocument();
    expect(createBody).toMatchObject({
      place_id: PLACE_ID,
      space_id: SPACE_ID,
      customer_email: "alice@example.com"
    });
    expect(typeof (createBody as unknown as { starts_at: string }).starts_at).toBe(
      "string"
    );
  });

  it("surfaces backend errors as toast notifications", async () => {
    server.use(
      http.post(`${TEST_API_BASE_URL}/reservations`, () =>
        HttpResponse.json(
          {
            error: {
              code: "CONFLICT",
              message: "Time window already booked.",
              details: {}
            }
          },
          { status: 409 }
        )
      )
    );

    const user = userEvent.setup();
    renderForm();

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Headquarters" })
      ).toBeInTheDocument()
    );

    await user.selectOptions(screen.getByLabelText("Place"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Space"), SPACE_ID);
    await user.type(
      screen.getByLabelText("Customer email"),
      "alice@example.com"
    );
    await user.type(screen.getByLabelText("Starts at"), "2026-05-01T10:00");
    await user.type(screen.getByLabelText("Ends at"), "2026-05-01T11:00");

    await user.click(
      screen.getByRole("button", { name: "Create reservation" })
    );

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Time window already booked.")
    );
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(screen.queryByTestId("list-page")).not.toBeInTheDocument();
  });
});
