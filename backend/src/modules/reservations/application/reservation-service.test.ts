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
    delete: async (id) => {
      const index = reservations.findIndex((reservation) => reservation.id === id);
      if (index === -1) return false;
      reservations.splice(index, 1);
      return true;
    },
    findActiveBySpaceBetween: async (spaceId, startsAt, endsAt) =>
      reservations.filter(
        (reservation) =>
          reservation.spaceId === spaceId &&
          reservation.status === "ACTIVE" &&
          reservation.startsAt < endsAt &&
          reservation.endsAt > startsAt
      ),
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
      ).length,
    runInSerializableTransaction: async (operation) => operation(repository)
  };

  return { repository, reservations };
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
        : null,
    findOfficeHour: async (_spaceId: string, dayOfWeek: number) =>
      dayOfWeek >= 1 && dayOfWeek <= 5
        ? {
            id: randomUUID(),
            spaceId: randomUUID(),
            dayOfWeek,
            opensAt: "08:00",
            closesAt: "18:00",
            isEnabled: true,
            createdAt: fixedNow,
            updatedAt: fixedNow
          }
        : null
  }) as never;

const createPlaceRepository = (placeId: string) =>
  ({
    findById: async (id: string) =>
      id === placeId
        ? {
            id: placeId,
            iotSiteId: "SITE_A",
            name: "Darient HQ",
            latitude: 8.9824,
            longitude: -79.5199,
            timezone: "America/Panama",
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
      createRepository([existing]).repository,
      createSpaceRepository(spaceId, placeId),
      createPlaceRepository(placeId),
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
    ).rejects.toMatchObject({
      code: "RESERVATION_CONFLICT",
      details: {
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
      }
    });
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
      createRepository(existingReservations).repository,
      createSpaceRepository(spaceId, placeId),
      createPlaceRepository(placeId),
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
      createRepository([reservation]).repository,
      createSpaceRepository(spaceId, placeId),
      createPlaceRepository(placeId),
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
      createRepository([expiredReservation]).repository,
      createSpaceRepository(expiredReservation.spaceId, expiredReservation.placeId),
      createPlaceRepository(expiredReservation.placeId),
      () => fixedNow
    );

    const result = await service.list({ page: 1, pageSize: 10 });

    expect(result.data[0].status).toBe("EXPIRED");
  });

  it("deletes a cancelled reservation", async () => {
    const placeId = randomUUID();
    const spaceId = randomUUID();
    const reservation = createReservation({
      placeId,
      spaceId,
      status: "CANCELLED",
      cancelledAt: fixedNow
    });
    const { repository } = createRepository([reservation]);
    const service = new ReservationService(
      repository,
      createSpaceRepository(spaceId, placeId),
      createPlaceRepository(placeId),
      () => fixedNow
    );

    await service.delete(reservation.id);

    await expect(service.get(reservation.id)).rejects.toMatchObject({
      code: "RESERVATION_NOT_FOUND"
    });
  });

  it("rejects deleting a reservation that is not cancelled", async () => {
    const placeId = randomUUID();
    const spaceId = randomUUID();
    const reservation = createReservation({ placeId, spaceId, status: "ACTIVE" });
    const service = new ReservationService(
      createRepository([reservation]).repository,
      createSpaceRepository(spaceId, placeId),
      createPlaceRepository(placeId),
      () => fixedNow
    );

    await expect(service.delete(reservation.id)).rejects.toMatchObject({
      code: "RESERVATION_MUST_BE_CANCELLED_BEFORE_DELETE"
    });
  });

  it("returns daily availability around active reservations", async () => {
    const placeId = randomUUID();
    const spaceId = randomUUID();
    const existing = createReservation({
      placeId,
      spaceId,
      startsAt: new Date("2026-04-28T14:00:00.000Z"),
      endsAt: new Date("2026-04-28T15:00:00.000Z")
    });
    const service = new ReservationService(
      createRepository([existing]).repository,
      createSpaceRepository(spaceId, placeId),
      createPlaceRepository(placeId),
      () => fixedNow
    );

    const availability = await service.getAvailability(spaceId, "2026-04-28");

    expect(availability).toMatchObject({
      spaceId,
      date: "2026-04-28",
      timezone: "America/Panama",
      officeHours: {
        opensAt: "08:00",
        closesAt: "18:00",
        isEnabled: true
      },
      reservedWindows: [
        {
          reservationId: existing.id,
          startsAt: new Date("2026-04-28T14:00:00.000Z"),
          endsAt: new Date("2026-04-28T15:00:00.000Z")
        }
      ],
      availableWindows: [
        {
          startsAt: new Date("2026-04-28T13:00:00.000Z"),
          endsAt: new Date("2026-04-28T14:00:00.000Z")
        },
        {
          startsAt: new Date("2026-04-28T15:00:00.000Z"),
          endsAt: new Date("2026-04-28T23:00:00.000Z")
        }
      ]
    });
  });

  it("retries a serialization failure and returns a conflict if another request wins", async () => {
    const placeId = randomUUID();
    const spaceId = randomUUID();
    const competingReservation = createReservation({
      placeId,
      spaceId,
      customerEmail: "winner@example.com",
      startsAt: new Date("2026-04-28T14:00:00.000Z"),
      endsAt: new Date("2026-04-28T15:00:00.000Z")
    });
    const { repository, reservations } = createRepository();
    let attempts = 0;

    repository.runInSerializableTransaction = async (operation) => {
      attempts += 1;

      if (attempts === 1) {
        reservations.push(competingReservation);
        throw Object.assign(new Error("write conflict"), {
          code: "P2034"
        });
      }

      return operation(repository);
    };

    const service = new ReservationService(
      repository,
      createSpaceRepository(spaceId, placeId),
      createPlaceRepository(placeId),
      () => fixedNow
    );

    await expect(
      service.create({
        placeId,
        spaceId,
        customerEmail: "contender@example.com",
        startsAt: new Date("2026-04-28T14:00:00.000Z"),
        endsAt: new Date("2026-04-28T15:00:00.000Z")
      })
    ).rejects.toMatchObject({
      code: "RESERVATION_CONFLICT"
    });

    expect(attempts).toBe(2);
  });
});
