import { describe, expect, it } from "vitest";

import { normalizeApiError } from "./errors";

describe("normalizeApiError", () => {
  it("traduce errores conocidos por code y mantiene details", () => {
    const availableWindows = [
      {
        starts_at: "2026-05-01T08:00:00.000Z",
        ends_at: "2026-05-01T09:00:00.000Z"
      }
    ];

    const normalized = normalizeApiError({
      response: {
        data: {
          error: {
            code: "RESERVATION_CONFLICT",
            message: "Reservation conflicts with another booking.",
            details: { available_windows: availableWindows }
          }
        }
      }
    });

    expect(normalized).toEqual({
      code: "RESERVATION_CONFLICT",
      message: "La oficina ya está reservada en el horario seleccionado.",
      details: { available_windows: availableWindows }
    });
  });

  it("conserva el mensaje original cuando el code no está mapeado", () => {
    const normalized = normalizeApiError({
      response: {
        data: {
          error: {
            code: "CUSTOM_BACKEND_ERROR",
            message: "Custom backend error.",
            details: {}
          }
        }
      }
    });

    expect(normalized.message).toBe("Custom backend error.");
  });
});
