import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";

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
});
