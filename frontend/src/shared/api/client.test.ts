import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { createApiClient } from "./client";
import { normalizeApiError } from "./errors";

describe("api client", () => {
  it("sends x-api-key on requests", async () => {
    const client = createApiClient({
      apiKey: "client-key",
      baseUrl: "http://localhost:3000/api/v1"
    });
    const captured: { config?: InternalAxiosRequestConfig } = {};

    await client.get("/health", {
      adapter: async (config) => {
        captured.config = config;
        return {
          config,
          data: { status: "ok" },
          headers: {},
          status: 200,
          statusText: "OK"
        };
      }
    });

    expect((captured.config?.headers as AxiosHeaders).get("x-api-key")).toBe(
      "client-key"
    );
  });

  it("normalizes backend error responses", () => {
    const error = normalizeApiError({
      response: {
        data: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request payload.",
            details: {}
          }
        }
      }
    });

    expect(error).toEqual({
      code: "VALIDATION_ERROR",
      message: "La solicitud contiene datos inválidos.",
      details: {}
    });
  });
});
