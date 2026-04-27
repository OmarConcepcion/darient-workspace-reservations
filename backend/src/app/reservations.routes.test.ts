import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import type { Reservation } from "../modules/reservations/domain/reservation.js";
import type { ReservationRepository } from "../modules/reservations/ports/reservation-repository.js";

const apiKey = { "x-api-key": "test-api-key" };
const fixedNow = new Date("2026-04-27T15:00:00.000Z");

const createRepositories = () => {
  const placeId = randomUUID();
  const spaceId = randomUUID();
  const reservations: Reservation[] = [];

  const reservationRepository: ReservationRepository = {
    create: async (input) => {
      const reservation: Reservation = {
        ...input,
        id: randomUUID(),
        status: "ACTIVE",
        cancelledAt: null,
        createdAt: fixedNow,
        updatedAt: fixedNow
      };
      reservations.push(reservation);
      return reservation;
    },
    findById: async (id) =>
      reservations.find((reservation) => reservation.id === id) ?? null,
    findPaginated: async ({ page, pageSize }) => ({
      data: reservations.slice((page - 1) * pageSize, page * pageSize),
      total: reservations.length
    }),
    update: async (id, input) => {
      const index = reservations.findIndex((reservation) => reservation.id === id);
      if (index === -1) return null;
      reservations[index] = {
        ...reservations[index],
        ...input,
        id,
        updatedAt: fixedNow
      };
      return reservations[index];
    },
    findActiveOverlaps: async (targetSpaceId, startsAt, endsAt, excludeId) =>
      reservations.filter(
        (reservation) =>
          reservation.id !== excludeId &&
          reservation.spaceId === targetSpaceId &&
          reservation.status === "ACTIVE" &&
          startsAt < reservation.endsAt &&
          endsAt > reservation.startsAt
      ),
    countActiveByCustomerEmailBetween: async (
      customerEmail,
      startsAt,
      endsAt,
      excludeId
    ) =>
      reservations.filter(
        (reservation) =>
          reservation.id !== excludeId &&
          reservation.customerEmail === customerEmail &&
          reservation.status === "ACTIVE" &&
          reservation.startsAt >= startsAt &&
          reservation.startsAt < endsAt
      ).length
  };

  return {
    placeId,
    spaceId,
    dependencies: {
      placeRepository: {
        create: async () => {
          throw new Error("not used");
        },
        findAll: async () => [],
        findById: async (id: string) =>
          id === placeId
            ? {
                id: placeId,
                iotSiteId: "SITE_A",
                name: "HQ",
                latitude: 8.95,
                longitude: -79.55,
                timezone: "America/Panama",
                createdAt: fixedNow,
                updatedAt: fixedNow
              }
            : null,
        update: async () => null,
        delete: async () => false
      },
      spaceRepository: {
        create: async () => {
          throw new Error("not used");
        },
        findAll: async () => [],
        findById: async (id: string) =>
          id === spaceId
            ? {
                id: spaceId,
                placeId,
                iotOfficeId: "OFFICE_1",
                name: "Focus Room",
                locationReference: null,
                capacity: 4,
                description: null,
                createdAt: fixedNow,
                updatedAt: fixedNow
              }
            : null,
        update: async () => null,
        delete: async () => false
      },
      reservationRepository
    }
  };
};

describe("reservation routes", () => {
  it("creates and lists reservations using snake_case payloads", async () => {
    const { dependencies, placeId, spaceId } = createRepositories();
    const app = createApp(dependencies);

    const createResponse = await request(app)
      .post("/api/v1/reservations")
      .set(apiKey)
      .send({
        place_id: placeId,
        space_id: spaceId,
        customer_email: "client@example.com",
        starts_at: "2026-04-28T14:00:00.000Z",
        ends_at: "2026-04-28T15:00:00.000Z"
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      place_id: placeId,
      space_id: spaceId,
      customer_email: "client@example.com",
      status: "ACTIVE"
    });

    const listResponse = await request(app)
      .get("/api/v1/reservations?page=1&page_size=10")
      .set(apiKey);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.pagination).toEqual({
      page: 1,
      page_size: 10,
      total: 1
    });
  });

  it("cancels a reservation through the cancel endpoint", async () => {
    const { dependencies, placeId, spaceId } = createRepositories();
    const app = createApp(dependencies);

    const createResponse = await request(app)
      .post("/api/v1/reservations")
      .set(apiKey)
      .send({
        place_id: placeId,
        space_id: spaceId,
        customer_email: "client@example.com",
        starts_at: "2026-04-28T14:00:00.000Z",
        ends_at: "2026-04-28T15:00:00.000Z"
      });

    const cancelResponse = await request(app)
      .patch(`/api/v1/reservations/${createResponse.body.id}/cancel`)
      .set(apiKey)
      .send();

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.status).toBe("CANCELLED");
    expect(cancelResponse.body.cancelled_at).toBeTruthy();
  });
});
