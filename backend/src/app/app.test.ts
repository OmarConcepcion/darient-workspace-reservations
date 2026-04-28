import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import { openApiSpec } from "../shared/openapi/openapi.js";

type OpenApiSpecShape = {
  paths?: Record<
    string,
    {
      get?: {
        security?: unknown[];
        responses?: Record<
          string,
          {
            content?: Record<string, unknown>;
          }
        >;
      };
    }
  >;
  components?: {
    responses?: Record<string, unknown>;
  };
};

describe("app foundation", () => {
  const app = createApp();

  it("returns health status without an api key", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "darient_backend"
    });
  });

  it("rejects protected routes without x-api-key", async () => {
    const response = await request(app).get("/api/v1/places");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid API key.",
        details: {}
      }
    });
  });

  it("serves the swagger ui without requiring an api key", async () => {
    const response = await request(app).get("/api/v1/docs");

    expect(response.status).toBe(301);
    expect(response.headers.location).toBe("/api/v1/docs/");
  });

  it("builds an openapi spec with documented paths and security", () => {
    const spec = openApiSpec as OpenApiSpecShape;

    expect(Object.keys(spec.paths ?? {})).toEqual(
      expect.arrayContaining([
        "/health",
        "/places",
        "/places/{place_id}",
        "/spaces",
        "/spaces/{space_id}",
        "/spaces/{space_id}/availability",
        "/reservations",
        "/reservations/{reservation_id}",
        "/reservations/{reservation_id}/cancel",
        "/admin/spaces/{space_id}/monitoring",
        "/admin/spaces/{space_id}/alerts",
        "/admin/spaces/{space_id}/device_desired",
        "/admin/events/stream"
      ])
    );

    expect(spec.paths?.["/health"]?.get?.security).toEqual([]);
    expect(spec.paths?.["/places"]?.get?.security).toEqual([
      { ApiKeyAuth: [] }
    ]);
    expect(spec.paths?.["/admin/events/stream"]?.get?.responses?.["200"]?.content).toHaveProperty(
      "text/event-stream"
    );
    expect(spec.components?.responses).toHaveProperty("UnauthorizedError");
  });
});
