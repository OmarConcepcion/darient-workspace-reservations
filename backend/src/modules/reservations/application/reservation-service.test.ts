import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { ReservationService } from "./reservation-service.js";
import type { Reservation } from "../domain/reservation.js";
import type { ReservationRepository } from "../ports/reservation-repository.js";

const fixedNow = new Date("2026-04-27T15:00:00.000Z");

const createReservation = (
  overrides: Partial<Reservation> = {}
): Reservation => ({
  id: randomUUID(),
  placeId: overrides.placeId ?? randomUUID(),
  spaceId: overrides.spaceId ?? randomUUID(),
  customerEmail: overrides.customerEmail ?? "customer@example.com",
  startsAt: overrides.startsAt ?? new Date("2026-04-28T14:00:00.000Z"),
  endsAt: overrides.endsAt ?? new Date("2026-04-28T15:00:00.000Z"),
  status: overrides.status ?? "ACTIVE",
  cancelledAt: overrides.cancelledAt ?? null,
  createdAt: overrides.createdAt ?? fixedNow,
  updatedAt: overrides.updatedAt ?? fixedNow
});

const createRepository = (initialReservations: Reservation[] = []) => {
  const reservations = [...initialReservations];

  const repository: ReservationRepository = {
    create: async (input) => {
      const reservation = createReservation(input);
      reservations.push(reservation);
      return reservation;
    },
    findById: async (id) =>
      reservations.find((reservation) => reservation.id === id) ?? null,
    findPaginated: async () => ({
      data: reservations,
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
    findActiveOverlaps: async (spaceId, startsAt, endsAt, excludeId) =>
      reservations.filter(
        (reservation) =>
          reservation.id !== excludeId &&
          reservation.spaceId === spaceId &&
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

  return repository;
};

const createSpaceRepository = (spaceId: string, placeId: string) =>
  ({
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
        : null
  }) as never;

describe("ReservationService", () => {
  it("rejects overlapping active reservations for the same space", async () => {
    const placeId = randomUUID();
    const spaceId = randomUUID();
    const existing = createReservation({
      placeId,
      spaceId,
      startsAt: new Date("2026-04-28T14:00:00.000Z"),
      endsAt: new Date("2026-04-28T15:00:00.000Z")
    });
    const service = new ReservationService(
      createRepository([existing]),
      createSpaceRepository(spaceId, placeId),
      () => fixedNow
    );

    await expect(
      service.create({
        placeId,
        spaceId,
        customerEmail: "other@example.com",
        startsAt: new Date("2026-04-28T14:30:00.000Z"),
        endsAt: new Date("2026-04-28T15:30:00.000Z")
      })
    ).rejects.toMatchObject({ code: "RESERVATION_CONFLICT" });
  });

  it("rejects a fourth active reservation in the same Panama week", async () => {
    const placeId = randomUUID();
    const spaceId = randomUUID();
    const customerEmail = "weekly@example.com";
    const existingReservations = [
      "2026-04-27T14:00:00.000Z",
      "2026-04-28T14:00:00.000Z",
      "2026-04-29T14:00:00.000Z"
    ].map((startsAt) =>
      createReservation({
        placeId,
        spaceId,
        customerEmail,
        startsAt: new Date(startsAt),
        endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000)
      })
    );
    const service = new ReservationService(
      createRepository(existingReservations),
      createSpaceRepository(spaceId, placeId),
      () => fixedNow
    );

    await expect(
      service.create({
        placeId,
        spaceId,
        customerEmail,
        startsAt: new Date("2026-04-30T16:00:00.000Z"),
        endsAt: new Date("2026-04-30T17:00:00.000Z")
      })
    ).rejects.toMatchObject({ code: "WEEKLY_RESERVATION_LIMIT_EXCEEDED" });
  });

  it("cancels an active reservation without deleting it", async () => {
    const placeId = randomUUID();
    const spaceId = randomUUID();
    const reservation = createReservation({ placeId, spaceId });
    const service = new ReservationService(
      createRepository([reservation]),
      createSpaceRepository(spaceId, placeId),
      () => fixedNow
    );

    const cancelled = await service.cancel(reservation.id);

    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.cancelledAt?.toISOString()).toBe(fixedNow.toISOString());
  });

  it("maps active reservations as expired when their end date is in the past", async () => {
    const expiredReservation = createReservation({
      startsAt: new Date("2026-04-26T14:00:00.000Z"),
      endsAt: new Date("2026-04-26T15:00:00.000Z"),
      status: "ACTIVE"
    });
    const service = new ReservationService(
      createRepository([expiredReservation]),
      createSpaceRepository(expiredReservation.spaceId, expiredReservation.placeId),
      () => fixedNow
    );

    const result = await service.list({ page: 1, pageSize: 10 });

    expect(result.data[0].status).toBe("EXPIRED");
  });
});
