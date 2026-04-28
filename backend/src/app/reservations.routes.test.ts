import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import type { Reservation } from "../modules/reservations/domain/reservation.js";
import type { ReservationRepository } from "../modules/reservations/ports/reservation-repository.js";

const apiKey = { "x-api-key": "test-api-key" };
const fixedNow = new Date("2026-04-27T15:00:00.000Z");
const futureStart = "2026-05-28T14:00:00.000Z";
const futureEnd = "2026-05-28T15:00:00.000Z";
const futureOverlapStart = "2026-05-28T14:30:00.000Z";
const futureOverlapEnd = "2026-05-28T15:30:00.000Z";

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
    delete: async (id) => {
      const index = reservations.findIndex((reservation) => reservation.id === id);
      if (index === -1) return false;
      reservations.splice(index, 1);
      return true;
    },
    findActiveBySpaceBetween: async (targetSpaceId, startsAt, endsAt) =>
      reservations.filter(
        (reservation) =>
          reservation.spaceId === targetSpaceId &&
          reservation.status === "ACTIVE" &&
          reservation.startsAt < endsAt &&
          reservation.endsAt > startsAt
      ),
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
      ).length,
    runInSerializableTransaction: async (operation) => operation(reservationRepository)
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
        findOfficeHour: async (_id: string, dayOfWeek: number) =>
          dayOfWeek >= 1 && dayOfWeek <= 5
            ? {
                id: randomUUID(),
                spaceId,
                dayOfWeek,
                opensAt: "08:00",
                closesAt: "18:00",
                isEnabled: true,
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
        starts_at: futureStart,
        ends_at: futureEnd
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
        starts_at: futureStart,
        ends_at: futureEnd
      });

    const cancelResponse = await request(app)
      .patch(`/api/v1/reservations/${createResponse.body.id}/cancel`)
      .set(apiKey)
      .send();

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.status).toBe("CANCELLED");
    expect(cancelResponse.body.cancelled_at).toBeTruthy();
  });

  it("deletes a reservation only after it is cancelled", async () => {
    const { dependencies, placeId, spaceId } = createRepositories();
    const app = createApp(dependencies);

    const createResponse = await request(app)
      .post("/api/v1/reservations")
      .set(apiKey)
      .send({
        place_id: placeId,
        space_id: spaceId,
        customer_email: "client@example.com",
        starts_at: futureStart,
        ends_at: futureEnd
      });

    const blockedDeleteResponse = await request(app)
      .delete(`/api/v1/reservations/${createResponse.body.id}`)
      .set(apiKey);

    expect(blockedDeleteResponse.status).toBe(409);
    expect(blockedDeleteResponse.body.error.code).toBe(
      "RESERVATION_MUST_BE_CANCELLED_BEFORE_DELETE"
    );

    await request(app)
      .patch(`/api/v1/reservations/${createResponse.body.id}/cancel`)
      .set(apiKey);

    const deleteResponse = await request(app)
      .delete(`/api/v1/reservations/${createResponse.body.id}`)
      .set(apiKey);

    expect(deleteResponse.status).toBe(204);
  });

  it("returns available windows when a reservation conflicts", async () => {
    const { dependencies, placeId, spaceId } = createRepositories();
    const app = createApp(dependencies);

    await request(app)
      .post("/api/v1/reservations")
      .set(apiKey)
      .send({
        place_id: placeId,
        space_id: spaceId,
        customer_email: "client@example.com",
        starts_at: futureStart,
        ends_at: futureEnd
      });

    const conflictResponse = await request(app)
      .post("/api/v1/reservations")
      .set(apiKey)
      .send({
        place_id: placeId,
        space_id: spaceId,
        customer_email: "other@example.com",
        starts_at: futureOverlapStart,
        ends_at: futureOverlapEnd
      });

    expect(conflictResponse.status).toBe(409);
    expect(conflictResponse.body.error.details.available_windows).toEqual([
      {
        starts_at: "2026-05-28T13:00:00.000Z",
        ends_at: "2026-05-28T14:00:00.000Z"
      },
      {
        starts_at: "2026-05-28T15:00:00.000Z",
        ends_at: "2026-05-28T23:00:00.000Z"
      }
    ]);
  });
});
