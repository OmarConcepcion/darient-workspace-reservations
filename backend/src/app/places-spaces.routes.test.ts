import request from "supertest";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";

type PlaceRecord = {
  id: string;
  iotSiteId: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

type SpaceRecord = {
  id: string;
  placeId: string;
  iotOfficeId: string;
  name: string;
  locationReference: string | null;
  capacity: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const now = new Date("2026-04-27T12:00:00.000Z");

const createRepositories = () => {
  const places = new Map<string, PlaceRecord>();
  const spaces = new Map<string, SpaceRecord>();

  return {
    placeRepository: {
      create: async (input: Omit<PlaceRecord, "id" | "createdAt" | "updatedAt">) => {
        const place = {
          ...input,
          id: randomUUID(),
          createdAt: now,
          updatedAt: now
        };
        places.set(place.id, place);
        return place;
      },
      findAll: async () => [...places.values()],
      findById: async (id: string) => places.get(id) ?? null,
      update: async (id: string, input: Partial<PlaceRecord>) => {
        const place = places.get(id);
        if (!place) return null;
        const updated = { ...place, ...input, id, updatedAt: now };
        places.set(id, updated);
        return updated;
      },
      delete: async (id: string) => places.delete(id)
    },
    spaceRepository: {
      create: async (input: Omit<SpaceRecord, "id" | "createdAt" | "updatedAt">) => {
        const space = {
          ...input,
          id: randomUUID(),
          createdAt: now,
          updatedAt: now
        };
        spaces.set(space.id, space);
        return space;
      },
      findAll: async () => [...spaces.values()],
      findById: async (id: string) => spaces.get(id) ?? null,
      update: async (id: string, input: Partial<SpaceRecord>) => {
        const space = spaces.get(id);
        if (!space) return null;
        const updated = { ...space, ...input, id, updatedAt: now };
        spaces.set(id, updated);
        return updated;
      },
      delete: async (id: string) => spaces.delete(id),
      existsPlace: async (placeId: string) => places.has(placeId)
    }
  };
};

const apiKey = { "x-api-key": "test-api-key" };

describe("places and spaces routes", () => {
  it("creates and lists places using snake_case payloads", async () => {
    const app = createApp(createRepositories());

    const createResponse = await request(app)
      .post("/api/v1/places")
      .set(apiKey)
      .send({
        iot_site_id: "SITE_B",
        name: "Branch Office",
        latitude: 8.95,
        longitude: -79.55,
        timezone: "America/Panama"
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      iot_site_id: "SITE_B",
      name: "Branch Office",
      latitude: 8.95,
      longitude: -79.55,
      timezone: "America/Panama"
    });

    const listResponse = await request(app).get("/api/v1/places").set(apiKey);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(createResponse.body.id);
  });

  it("updates and deletes a place", async () => {
    const app = createApp(createRepositories());

    const createResponse = await request(app)
      .post("/api/v1/places")
      .set(apiKey)
      .send({
        iot_site_id: "SITE_C",
        name: "Original",
        latitude: 8.95,
        longitude: -79.55,
        timezone: "America/Panama"
      });

    const updateResponse = await request(app)
      .patch(`/api/v1/places/${createResponse.body.id}`)
      .set(apiKey)
      .send({ name: "Updated" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe("Updated");

    const deleteResponse = await request(app)
      .delete(`/api/v1/places/${createResponse.body.id}`)
      .set(apiKey);

    expect(deleteResponse.status).toBe(204);
  });

  it("creates and lists spaces for an existing place", async () => {
    const app = createApp(createRepositories());

    const placeResponse = await request(app)
      .post("/api/v1/places")
      .set(apiKey)
      .send({
        iot_site_id: "SITE_D",
        name: "HQ",
        latitude: 8.95,
        longitude: -79.55,
        timezone: "America/Panama"
      });

    const createSpaceResponse = await request(app)
      .post("/api/v1/spaces")
      .set(apiKey)
      .send({
        place_id: placeResponse.body.id,
        iot_office_id: "OFFICE_9",
        name: "Focus Room",
        location_reference: "Level 2",
        capacity: 4,
        description: "Quiet room"
      });

    expect(createSpaceResponse.status).toBe(201);
    expect(createSpaceResponse.body).toMatchObject({
      place_id: placeResponse.body.id,
      iot_office_id: "OFFICE_9",
      name: "Focus Room",
      capacity: 4
    });

    const listResponse = await request(app).get("/api/v1/spaces").set(apiKey);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(createSpaceResponse.body.id);
  });

  it("rejects a space for a missing place", async () => {
    const app = createApp(createRepositories());

    const response = await request(app)
      .post("/api/v1/spaces")
      .set(apiKey)
      .send({
        place_id: randomUUID(),
        iot_office_id: "OFFICE_10",
        name: "Missing Place Room",
        capacity: 2
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("PLACE_NOT_FOUND");
  });
});
