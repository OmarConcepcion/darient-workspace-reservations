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
const SECOND_PLACE_ID = "33333333-3333-3333-3333-333333333333";
const SECOND_SPACE_ID = "55555555-5555-5555-5555-555555555555";
const THIRD_SPACE_ID = "66666666-6666-6666-6666-666666666666";

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

const secondPlaceFixture = {
  id: SECOND_PLACE_ID,
  iot_site_id: "SITE_B",
  name: "Annex",
  latitude: 8.99,
  longitude: -79.5,
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

const secondSpaceFixture = {
  id: SECOND_SPACE_ID,
  place_id: SECOND_PLACE_ID,
  iot_office_id: "OFFICE_2",
  name: "Focus Room",
  location_reference: null,
  capacity: 4,
  description: null,
  created_at: "2026-04-27T10:00:00.000Z",
  updated_at: "2026-04-27T10:00:00.000Z"
};

const thirdSpaceFixture = {
  id: THIRD_SPACE_ID,
  place_id: PLACE_ID,
  iot_office_id: "OFFICE_3",
  name: "Quiet Pod",
  location_reference: null,
  capacity: 2,
  description: null,
  created_at: "2026-04-27T10:00:00.000Z",
  updated_at: "2026-04-27T10:00:00.000Z"
};

const toastSuccess = vi.fn();
const toastError = vi.fn();
const formatLocalWindow = (startsAt: string, endsAt: string) =>
  `${formatLocalTime(startsAt)} - ${formatLocalTime(endsAt)}`;

const formatLocalTime = (value: string) => {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

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
      HttpResponse.json({ data: [placeFixture, secondPlaceFixture] })
    ),
    http.get(`${TEST_API_BASE_URL}/spaces`, () =>
      HttpResponse.json({ data: [spaceFixture, secondSpaceFixture, thirdSpaceFixture] })
    ),
    http.get(`${TEST_API_BASE_URL}/spaces/${SPACE_ID}/availability`, ({ request }) => {
      const date = new URL(request.url).searchParams.get("date") ?? "2026-05-01";

      return HttpResponse.json({
        space_id: SPACE_ID,
        date,
        timezone: "America/Panama",
        office_hours: {
          opens_at: "08:00",
          closes_at: "18:00",
          is_enabled: true
        },
        reserved_windows: [
          {
            reservation_id: "77777777-7777-7777-7777-777777777777",
            starts_at: `${date}T13:00:00.000Z`,
            ends_at: `${date}T14:00:00.000Z`
          }
        ],
        available_windows: [
          {
            starts_at: `${date}T08:00:00.000Z`,
            ends_at: `${date}T13:00:00.000Z`
          },
          {
            starts_at: `${date}T14:00:00.000Z`,
            ends_at: `${date}T18:00:00.000Z`
          }
        ]
      });
    }),
    http.get(
      `${TEST_API_BASE_URL}/spaces/${THIRD_SPACE_ID}/availability`,
      ({ request }) => {
        const date = new URL(request.url).searchParams.get("date") ?? "2026-05-01";

        return HttpResponse.json({
          space_id: THIRD_SPACE_ID,
          date,
          timezone: "America/Panama",
          office_hours: {
            opens_at: "08:00",
            closes_at: "18:00",
            is_enabled: true
          },
          reserved_windows: [],
          available_windows: [
            {
              starts_at: `${date}T09:00:00.000Z`,
              ends_at: `${date}T18:00:00.000Z`
            }
          ]
        });
      }
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
        element={<div data-testid="list-page">lista de reservas</div>}
      />
    </Routes>,
    { router: { initialEntries: ["/reservations/new"] } }
  );

describe("NewReservationView", () => {
  it("opens native date and time pickers when clicking anywhere inside the inputs", async () => {
    const user = userEvent.setup();
    const showPicker = vi.fn();
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "showPicker"
    );

    Object.defineProperty(HTMLInputElement.prototype, "showPicker", {
      configurable: true,
      value: showPicker
    });

    renderForm();

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Headquarters" })
      ).toBeInTheDocument()
    );

    await user.click(screen.getByLabelText("Fecha de la reserva"));
    await user.click(screen.getByLabelText("Hora de inicio"));
    await user.click(screen.getByLabelText("Hora de finalización"));

    expect(showPicker).toHaveBeenCalledTimes(3);

    if (descriptor) {
      Object.defineProperty(HTMLInputElement.prototype, "showPicker", descriptor);
    } else {
      Reflect.deleteProperty(
        HTMLInputElement.prototype as HTMLInputElement & {
          showPicker?: () => void;
        },
        "showPicker"
      );
    }
  });

  it("blocks submission and surfaces inline errors when fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Headquarters" })
      ).toBeInTheDocument()
    );

    await user.click(
      screen.getByRole("button", { name: "Crear reserva" })
    );

    expect(await screen.findByText("Debes seleccionar un lugar")).toBeInTheDocument();
    expect(screen.getByText("Debes seleccionar una oficina")).toBeInTheDocument();
    expect(screen.getByText("Ingresa un correo válido")).toBeInTheDocument();
    expect(screen.getByText("La fecha de la reserva es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("La hora de inicio es obligatoria")).toBeInTheDocument();
    expect(screen.getByText("La hora de finalización es obligatoria")).toBeInTheDocument();
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

    await user.selectOptions(screen.getByLabelText("Lugar"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Oficina"), SPACE_ID);
    await user.type(
      screen.getByLabelText("Correo del cliente"),
      "alice@example.com"
    );
    await user.type(screen.getByLabelText("Fecha de la reserva"), "2026-05-01");
    await user.type(screen.getByLabelText("Hora de inicio"), "10:00");
    await user.type(screen.getByLabelText("Hora de finalización"), "09:00");

    await user.click(
      screen.getByRole("button", { name: "Crear reserva" })
    );

    expect(
      await screen.findByText(
        "La hora de finalización debe ser posterior a la hora de inicio"
      )
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

    await user.selectOptions(screen.getByLabelText("Lugar"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Oficina"), SPACE_ID);
    await user.type(
      screen.getByLabelText("Correo del cliente"),
      "alice@example.com"
    );
    await user.type(screen.getByLabelText("Fecha de la reserva"), "2026-05-01");
    await user.type(screen.getByLabelText("Hora de inicio"), "10:00");
    await user.type(screen.getByLabelText("Hora de finalización"), "11:00");

    await user.click(
      screen.getByRole("button", { name: "Crear reserva" })
    );

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Reserva creada."));
    expect(await screen.findByTestId("list-page")).toBeInTheDocument();
    expect(createBody).toMatchObject({
      place_id: PLACE_ID,
      space_id: SPACE_ID,
      customer_email: "alice@example.com"
    });
    expect(createBody).not.toBeNull();
    if (!createBody) {
      throw new Error("Expected reservation payload to be captured.");
    }

    const payload = createBody as Record<string, string>;

    expect(typeof payload.starts_at).toBe("string");
    expect(typeof payload.ends_at).toBe("string");
    expect(
      new Date(payload.ends_at).getTime() - new Date(payload.starts_at).getTime()
    ).toBe(60 * 60 * 1000);
  });

  it("surfaces backend errors as toast notifications and inline feedback", async () => {
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

    await user.selectOptions(screen.getByLabelText("Lugar"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Oficina"), SPACE_ID);
    await user.type(
      screen.getByLabelText("Correo del cliente"),
      "alice@example.com"
    );
    await user.type(screen.getByLabelText("Fecha de la reserva"), "2026-05-01");
    await user.type(screen.getByLabelText("Hora de inicio"), "10:00");
    await user.type(screen.getByLabelText("Hora de finalización"), "11:00");

    await user.click(
      screen.getByRole("button", { name: "Crear reserva" })
    );

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "La acción no se pudo completar por un conflicto con el estado actual."
      )
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "La acción no se pudo completar por un conflicto con el estado actual."
    );
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(screen.queryByTestId("list-page")).not.toBeInTheDocument();
  });

  it("shows available windows when a reservation conflict includes suggestions", async () => {
    server.use(
      http.post(`${TEST_API_BASE_URL}/reservations`, () =>
        HttpResponse.json(
          {
            error: {
              code: "RESERVATION_CONFLICT",
              message: "The selected space is already reserved for that time range.",
              details: {
                available_windows: [
                  {
                    starts_at: "2026-05-01T13:00:00.000Z",
                    ends_at: "2026-05-01T15:00:00.000Z"
                  },
                  {
                    starts_at: "2026-05-01T16:00:00.000Z",
                    ends_at: "2026-05-01T23:00:00.000Z"
                  }
                ]
              }
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

    await user.selectOptions(screen.getByLabelText("Lugar"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Oficina"), SPACE_ID);
    await user.type(
      screen.getByLabelText("Correo del cliente"),
      "alice@example.com"
    );
    await user.type(screen.getByLabelText("Fecha de la reserva"), "2026-05-01");
    await user.type(screen.getByLabelText("Hora de inicio"), "10:00");
    await user.type(screen.getByLabelText("Hora de finalización"), "11:00");
    await user.click(
      screen.getByRole("button", { name: "Crear reserva" })
    );

    expect(await screen.findByText("Disponible hoy para esta oficina")).toBeInTheDocument();
    expect(screen.getAllByText(/mayo/i).length).toBeGreaterThan(0);
  });

  it("loads daily availability reference after selecting a space and date", async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Headquarters" })
      ).toBeInTheDocument()
    );

    await user.selectOptions(screen.getByLabelText("Lugar"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Oficina"), SPACE_ID);
    await user.type(screen.getByLabelText("Fecha de la reserva"), "2026-05-01");

    expect(await screen.findByText("Referencia de disponibilidad")).toBeInTheDocument();
    expect(screen.getByText("Disponible")).toBeInTheDocument();
    expect(screen.getByText("Reservado")).toBeInTheDocument();
    const availableWindowLabel = formatLocalWindow(
      "2026-05-01T08:00:00.000Z",
      "2026-05-01T13:00:00.000Z"
    );
    const reservedWindowLabel = formatLocalWindow(
      "2026-05-01T13:00:00.000Z",
      "2026-05-01T14:00:00.000Z"
    );

    expect(
      screen.getByText((content) => content.includes(availableWindowLabel))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes(reservedWindowLabel))
    ).toBeInTheDocument();
  });

  it("shows a dynamic preview for the selected time range", async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Headquarters" })
      ).toBeInTheDocument()
    );

    await user.selectOptions(screen.getByLabelText("Lugar"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Oficina"), SPACE_ID);
    await user.type(screen.getByLabelText("Fecha de la reserva"), "2026-05-01");
    await user.type(screen.getByLabelText("Hora de inicio"), "10:00");
    await user.type(screen.getByLabelText("Hora de finalización"), "12:00");

    expect(await screen.findByText("Rango seleccionado")).toBeInTheDocument();
    expect(screen.getByText("10:00 - 12:00")).toBeInTheDocument();
  });

  it("resets downstream fields when the place changes", async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Headquarters" })
      ).toBeInTheDocument()
    );

    await user.selectOptions(screen.getByLabelText("Lugar"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Oficina"), SPACE_ID);
    await user.type(screen.getByLabelText("Fecha de la reserva"), "2026-05-01");
    await user.type(screen.getByLabelText("Hora de inicio"), "10:00");
    await user.type(screen.getByLabelText("Hora de finalización"), "12:00");

    await user.selectOptions(screen.getByLabelText("Lugar"), SECOND_PLACE_ID);

    expect(screen.getByLabelText("Oficina")).toHaveValue("");
    expect(screen.getByLabelText("Fecha de la reserva")).toHaveValue("");
    expect(screen.getByLabelText("Hora de inicio")).toHaveValue("");
    expect(screen.getByLabelText("Hora de finalización")).toHaveValue("");
  });

  it("keeps the date but clears the time range when the space changes", async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Headquarters" })
      ).toBeInTheDocument()
    );

    await user.selectOptions(screen.getByLabelText("Lugar"), PLACE_ID);
    await user.selectOptions(screen.getByLabelText("Oficina"), SPACE_ID);
    await user.type(screen.getByLabelText("Fecha de la reserva"), "2026-05-01");
    await user.type(screen.getByLabelText("Hora de inicio"), "10:00");
    await user.type(screen.getByLabelText("Hora de finalización"), "12:00");

    await user.selectOptions(screen.getByLabelText("Oficina"), THIRD_SPACE_ID);

    expect(screen.getByLabelText("Fecha de la reserva")).toHaveValue("2026-05-01");
    expect(screen.getByLabelText("Hora de inicio")).toHaveValue("");
    expect(screen.getByLabelText("Hora de finalización")).toHaveValue("");
  });
});
