import type { PrismaClient } from "@prisma/client";

import { prisma } from "../../../shared/prisma/prisma.js";
import type {
  CreateReservationInput,
  Reservation,
  ReservationListInput
} from "../domain/reservation.js";
import type {
  PersistedReservationUpdateInput,
  ReservationRepository
} from "../ports/reservation-repository.js";

export class PrismaReservationRepository implements ReservationRepository {
  public constructor(private readonly client: PrismaClient = prisma) {}

  public async create(input: CreateReservationInput): Promise<Reservation> {
    const reservation = await this.client.reservation.create({
      data: input
    });

    return reservation as Reservation;
  }

  public async findById(id: string): Promise<Reservation | null> {
    const reservation = await this.client.reservation.findUnique({
      where: { id }
    });

    return reservation as Reservation | null;
  }

  public async findPaginated({
    page,
    pageSize
  }: ReservationListInput): Promise<{ data: Reservation[]; total: number }> {
    const [data, total] = await this.client.$transaction([
      this.client.reservation.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      this.client.reservation.count()
    ]);

    return {
      data: data as Reservation[],
      total
    };
  }

  public async update(
    id: string,
    input: PersistedReservationUpdateInput
  ): Promise<Reservation | null> {
    const result = await this.client.reservation.updateManyAndReturn({
      where: { id },
      data: input
    });

    return (result[0] as Reservation | undefined) ?? null;
  }

  public async findActiveOverlaps(
    spaceId: string,
    startsAt: Date,
    endsAt: Date,
    excludeReservationId?: string
  ): Promise<Reservation[]> {
    const reservations = await this.client.reservation.findMany({
      where: {
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        spaceId,
        status: "ACTIVE",
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt }
      }
    });

    return reservations as Reservation[];
  }

  public countActiveByCustomerEmailBetween(
    customerEmail: string,
    startsAt: Date,
    endsAt: Date,
    excludeReservationId?: string
  ): Promise<number> {
    return this.client.reservation.count({
      where: {
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        customerEmail,
        status: "ACTIVE",
        startsAt: {
          gte: startsAt,
          lt: endsAt
        }
      }
    });
  }
}
