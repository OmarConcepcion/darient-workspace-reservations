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

type ReservationRecord = {
  id: string;
  placeId: string;
  spaceId: string;
  customerEmail: string;
  startsAt: Date;
  endsAt: Date;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const now = new Date("2026-04-27T12:00:00.000Z");

const createRepositories = () => {
  const places = new Map<string, PlaceRecord>();
  const spaces = new Map<string, SpaceRecord>();
  const reservations = new Map<string, ReservationRecord>();

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
      findOfficeHour: async (spaceId: string, dayOfWeek: number) =>
        spaces.has(spaceId) && dayOfWeek >= 1 && dayOfWeek <= 5
          ? {
              id: randomUUID(),
              spaceId,
              dayOfWeek,
              opensAt: "08:00",
              closesAt: "18:00",
              isEnabled: true,
              createdAt: now,
              updatedAt: now
            }
          : null,
      update: async (id: string, input: Partial<SpaceRecord>) => {
        const space = spaces.get(id);
        if (!space) return null;
        const updated = { ...space, ...input, id, updatedAt: now };
        spaces.set(id, updated);
        return updated;
      },
      delete: async (id: string) => spaces.delete(id),
      existsPlace: async (placeId: string) => places.has(placeId)
    },
    reservationRepository: {
      create: async (input: Omit<ReservationRecord, "id" | "status" | "cancelledAt" | "createdAt" | "updatedAt">) => {
        const reservation: ReservationRecord = {
          ...input,
          id: randomUUID(),
          status: "ACTIVE",
          cancelledAt: null,
          createdAt: now,
          updatedAt: now
        };
        reservations.set(reservation.id, reservation);
        return reservation;
      },
      findById: async (id: string) => reservations.get(id) ?? null,
      findPaginated: async () => ({
        data: [...reservations.values()],
        total: reservations.size
      }),
      update: async (id: string, input: Partial<ReservationRecord>) => {
        const reservation = reservations.get(id);
        if (!reservation) return null;
        const updated = { ...reservation, ...input, id, updatedAt: now };
        reservations.set(id, updated);
        return updated;
      },
      delete: async (id: string) => reservations.delete(id),
      findActiveBySpaceBetween: async (
        spaceId: string,
        startsAt: Date,
        endsAt: Date
      ) =>
        [...reservations.values()].filter(
          (reservation) =>
            reservation.spaceId === spaceId &&
            reservation.status === "ACTIVE" &&
            reservation.startsAt < endsAt &&
            reservation.endsAt > startsAt
        ),
      findActiveOverlaps: async (
        spaceId: string,
        startsAt: Date,
        endsAt: Date,
        excludeId?: string
      ) =>
        [...reservations.values()].filter(
          (reservation) =>
            reservation.id !== excludeId &&
            reservation.spaceId === spaceId &&
            reservation.status === "ACTIVE" &&
            startsAt < reservation.endsAt &&
            endsAt > reservation.startsAt
        ),
      countActiveByCustomerEmailBetween: async () => 0
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

  it("returns daily availability for a space", async () => {
    const repositories = createRepositories();
    const app = createApp(repositories);

    const placeResponse = await request(app)
      .post("/api/v1/places")
      .set(apiKey)
      .send({
        iot_site_id: "SITE_E",
        name: "HQ",
        latitude: 8.95,
        longitude: -79.55,
        timezone: "America/Panama"
      });

    const spaceResponse = await request(app)
      .post("/api/v1/spaces")
      .set(apiKey)
      .send({
        place_id: placeResponse.body.id,
        iot_office_id: "OFFICE_11",
        name: "Focus Room",
        capacity: 4
      });

    await request(app)
      .post("/api/v1/reservations")
      .set(apiKey)
      .send({
        place_id: placeResponse.body.id,
        space_id: spaceResponse.body.id,
        customer_email: "client@example.com",
        starts_at: "2026-04-28T14:00:00.000Z",
        ends_at: "2026-04-28T15:00:00.000Z"
      });

    const response = await request(app)
      .get(`/api/v1/spaces/${spaceResponse.body.id}/availability?date=2026-04-28`)
      .set(apiKey);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      space_id: spaceResponse.body.id,
      date: "2026-04-28",
      timezone: "America/Panama",
      office_hours: {
        opens_at: "08:00",
        closes_at: "18:00",
        is_enabled: true
      },
      reserved_windows: [
        {
          starts_at: "2026-04-28T14:00:00.000Z",
          ends_at: "2026-04-28T15:00:00.000Z"
        }
      ],
      available_windows: [
        {
          starts_at: "2026-04-28T13:00:00.000Z",
          ends_at: "2026-04-28T14:00:00.000Z"
        },
        {
          starts_at: "2026-04-28T15:00:00.000Z",
          ends_at: "2026-04-28T23:00:00.000Z"
        }
      ]
    });
  });
});
