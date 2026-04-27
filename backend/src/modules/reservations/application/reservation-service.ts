import { AppError } from "../../../shared/errors/app-error.js";
import type { SpaceRepository } from "../../spaces/ports/space-repository.js";
import type {
  CreateReservationInput,
  Reservation,
  ReservationListInput,
  ReservationPage,
  UpdateReservationInput
} from "../domain/reservation.js";
import type { ReservationRepository } from "../ports/reservation-repository.js";
import { getPanamaWeekRange } from "./panama-week.js";

const MAX_ACTIVE_WEEKLY_RESERVATIONS = 3;

export class ReservationService {
  public constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly spaceRepository: SpaceRepository,
    private readonly getNow: () => Date = () => new Date()
  ) {}

  public async create(input: CreateReservationInput): Promise<Reservation> {
    this.assertValidTimeWindow(input.startsAt, input.endsAt);
    await this.assertSpaceBelongsToPlace(input.spaceId, input.placeId);
    await this.assertNoConflict(input.spaceId, input.startsAt, input.endsAt);
    await this.assertWeeklyLimit(
      input.customerEmail,
      input.startsAt,
      undefined
    );

    return this.withEffectiveStatus(await this.reservationRepository.create(input));
  }

  public async list(input: ReservationListInput): Promise<ReservationPage> {
    const result = await this.reservationRepository.findPaginated(input);

    return {
      data: result.data.map((reservation) =>
        this.withEffectiveStatus(reservation)
      ),
      total: result.total,
      page: input.page,
      pageSize: input.pageSize
    };
  }

  public async get(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(id);

    if (!reservation) {
      throw new AppError(
        404,
        "RESERVATION_NOT_FOUND",
        "Reservation not found."
      );
    }

    return this.withEffectiveStatus(reservation);
  }

  public async update(
    id: string,
    input: UpdateReservationInput
  ): Promise<Reservation> {
    const existing = await this.getPersisted(id);
    const next = {
      ...existing,
      ...input
    };

    this.assertValidTimeWindow(next.startsAt, next.endsAt);
    await this.assertSpaceBelongsToPlace(next.spaceId, next.placeId);

    if (next.status === "ACTIVE") {
      await this.assertNoConflict(next.spaceId, next.startsAt, next.endsAt, id);
      await this.assertWeeklyLimit(next.customerEmail, next.startsAt, id);
    }

    const updated = await this.reservationRepository.update(id, input);

    if (!updated) {
      throw new AppError(
        404,
        "RESERVATION_NOT_FOUND",
        "Reservation not found."
      );
    }

    return this.withEffectiveStatus(updated);
  }

  public async cancel(id: string): Promise<Reservation> {
    await this.getPersisted(id);

    const updated = await this.reservationRepository.update(id, {
      status: "CANCELLED",
      cancelledAt: this.getNow()
    });

    if (!updated) {
      throw new AppError(
        404,
        "RESERVATION_NOT_FOUND",
        "Reservation not found."
      );
    }

    return this.withEffectiveStatus(updated);
  }

  private async getPersisted(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findById(id);

    if (!reservation) {
      throw new AppError(
        404,
        "RESERVATION_NOT_FOUND",
        "Reservation not found."
      );
    }

    return reservation;
  }

  private assertValidTimeWindow(startsAt: Date, endsAt: Date): void {
    if (startsAt >= endsAt) {
      throw new AppError(
        400,
        "INVALID_RESERVATION_TIME",
        "Reservation starts_at must be before ends_at."
      );
    }
  }

  private async assertSpaceBelongsToPlace(
    spaceId: string,
    placeId: string
  ): Promise<void> {
    const space = await this.spaceRepository.findById(spaceId);

    if (!space) {
      throw new AppError(404, "SPACE_NOT_FOUND", "Space not found.");
    }

    if (space.placeId !== placeId) {
      throw new AppError(
        400,
        "PLACE_SPACE_MISMATCH",
        "The space does not belong to the selected place."
      );
    }
  }

  private async assertNoConflict(
    spaceId: string,
    startsAt: Date,
    endsAt: Date,
    excludeReservationId?: string
  ): Promise<void> {
    const overlaps = await this.reservationRepository.findActiveOverlaps(
      spaceId,
      startsAt,
      endsAt,
      excludeReservationId
    );

    if (overlaps.length > 0) {
      throw new AppError(
        409,
        "RESERVATION_CONFLICT",
        "The selected space is already reserved for that time range."
      );
    }
  }

  private async assertWeeklyLimit(
    customerEmail: string,
    startsAt: Date,
    excludeReservationId?: string
  ): Promise<void> {
    const weekRange = getPanamaWeekRange(startsAt);
    const activeCount =
      await this.reservationRepository.countActiveByCustomerEmailBetween(
        customerEmail,
        weekRange.startsAt,
        weekRange.endsAt,
        excludeReservationId
      );

    if (activeCount >= MAX_ACTIVE_WEEKLY_RESERVATIONS) {
      throw new AppError(
        409,
        "WEEKLY_RESERVATION_LIMIT_EXCEEDED",
        "A customer can have at most 3 active reservations per week."
      );
    }
  }

  private withEffectiveStatus(reservation: Reservation): Reservation {
    if (
      reservation.status === "ACTIVE" &&
      reservation.endsAt <= this.getNow()
    ) {
      return {
        ...reservation,
        status: "EXPIRED"
      };
    }

    return reservation;
  }
}
