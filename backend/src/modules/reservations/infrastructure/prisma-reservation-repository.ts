import { Prisma, type PrismaClient } from "@prisma/client";

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

type ReservationDbClient = PrismaClient | Prisma.TransactionClient;

export class PrismaReservationRepository implements ReservationRepository {
  public constructor(
    private readonly transactionRunner: PrismaClient = prisma,
    private readonly db: ReservationDbClient = transactionRunner
  ) {}

  public async create(input: CreateReservationInput): Promise<Reservation> {
    const reservation = await this.db.reservation.create({
      data: input
    });

    return reservation as Reservation;
  }

  public async findById(id: string): Promise<Reservation | null> {
    const reservation = await this.db.reservation.findUnique({
      where: { id }
    });

    return reservation as Reservation | null;
  }

  public async findPaginated({
    page,
    pageSize
  }: ReservationListInput): Promise<{ data: Reservation[]; total: number }> {
    const [data, total] = await this.transactionRunner.$transaction([
      this.transactionRunner.reservation.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      this.transactionRunner.reservation.count()
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
    const result = await this.db.reservation.updateManyAndReturn({
      where: { id },
      data: input
    });

    return (result[0] as Reservation | undefined) ?? null;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.db.reservation.deleteMany({
      where: { id }
    });

    return result.count > 0;
  }

  public async findActiveBySpaceBetween(
    spaceId: string,
    startsAt: Date,
    endsAt: Date
  ): Promise<Reservation[]> {
    const reservations = await this.db.reservation.findMany({
      where: {
        spaceId,
        status: "ACTIVE",
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt }
      },
      orderBy: { startsAt: "asc" }
    });

    return reservations as Reservation[];
  }

  public async findActiveOverlaps(
    spaceId: string,
    startsAt: Date,
    endsAt: Date,
    excludeReservationId?: string
  ): Promise<Reservation[]> {
    const reservations = await this.db.reservation.findMany({
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
    return this.db.reservation.count({
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

  public runInSerializableTransaction<T>(
    operation: (repository: ReservationRepository) => Promise<T>
  ): Promise<T> {
    if (this.db !== this.transactionRunner) {
      return operation(this);
    }

    return this.transactionRunner.$transaction(
      async (transaction) =>
        operation(
          new PrismaReservationRepository(this.transactionRunner, transaction)
        ),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );
  }
}
