import { AppError } from "../../../shared/errors/app-error.js";
import type { PlaceRepository } from "../../places/ports/place-repository.js";
import type { SpaceRepository } from "../../spaces/ports/space-repository.js";
import type {
  CreateReservationInput,
  DailyAvailability,
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
    private readonly placeRepository: PlaceRepository,
    private readonly getNow: () => Date = () => new Date()
  ) {}

  public async create(input: CreateReservationInput): Promise<Reservation> {
    this.assertValidTimeWindow(input.startsAt, input.endsAt);
    await this.assertSpaceBelongsToPlace(input.spaceId, input.placeId);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const reservation =
          await this.reservationRepository.runInSerializableTransaction(
            async (reservationRepository) => {
              await this.assertNoConflict(
                input.spaceId,
                input.startsAt,
                input.endsAt,
                undefined,
                reservationRepository
              );
              await this.assertWeeklyLimit(
                input.customerEmail,
                input.startsAt,
                undefined,
                reservationRepository
              );

              return reservationRepository.create(input);
            }
          );

        return this.withEffectiveStatus(reservation);
      } catch (error) {
        if (!isRetryableTransactionError(error)) {
          throw error;
        }

        if (attempt === 1) {
          await this.resolveCreateConflictAfterRetryableFailure(input);
        }
      }
    }

    throw new AppError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Unexpected error while creating reservation."
    );
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

  public async delete(id: string): Promise<void> {
    const existing = await this.getPersisted(id);
    const effective = this.withEffectiveStatus(existing);

    if (effective.status !== "CANCELLED") {
      throw new AppError(
        409,
        "RESERVATION_MUST_BE_CANCELLED_BEFORE_DELETE",
        "Reservation must be cancelled before it can be deleted."
      );
    }

    const deleted = await this.reservationRepository.delete(id);

    if (!deleted) {
      throw new AppError(
        404,
        "RESERVATION_NOT_FOUND",
        "Reservation not found."
      );
    }
  }

  public async getAvailability(
    spaceId: string,
    date: string
  ): Promise<DailyAvailability> {
    this.assertValidDateOnly(date);
    const { space, timezone } = await this.getSpaceContext(spaceId);
    const dayOfWeek = getDayOfWeek(date, timezone);
    const officeHour = await this.spaceRepository.findOfficeHour(
      space.id,
      dayOfWeek
    );

    if (!officeHour || !officeHour.isEnabled) {
      return {
        spaceId: space.id,
        date,
        timezone,
        officeHours: {
          opensAt: officeHour?.opensAt ?? null,
          closesAt: officeHour?.closesAt ?? null,
          isEnabled: false
        },
        reservedWindows: [],
        availableWindows: []
      };
    }

    const opensAt = zonedDateTimeToUtc(date, officeHour.opensAt, timezone);
    const closesAt = zonedDateTimeToUtc(date, officeHour.closesAt, timezone);
    const reservations =
      await this.reservationRepository.findActiveBySpaceBetween(
        space.id,
        opensAt,
        closesAt
      );
    const reservedWindows = reservations
      .map((reservation) => ({
        reservationId: reservation.id,
        startsAt: maxDate(reservation.startsAt, opensAt),
        endsAt: minDate(reservation.endsAt, closesAt)
      }))
      .filter((window) => window.startsAt < window.endsAt)
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());

    return {
      spaceId: space.id,
      date,
      timezone,
      officeHours: {
        opensAt: officeHour.opensAt,
        closesAt: officeHour.closesAt,
        isEnabled: true
      },
      reservedWindows,
      availableWindows: buildAvailableWindows(opensAt, closesAt, reservedWindows)
    };
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
    excludeReservationId?: string,
    reservationRepository: Pick<ReservationRepository, "findActiveOverlaps"> = this
      .reservationRepository
  ): Promise<void> {
    const overlaps = await reservationRepository.findActiveOverlaps(
      spaceId,
      startsAt,
      endsAt,
      excludeReservationId
    );

    if (overlaps.length > 0) {
      const availability = await this.getAvailability(
        spaceId,
        getDateInTimezone(startsAt, await this.getTimezoneForSpace(spaceId))
      );
      throw new AppError(
        409,
        "RESERVATION_CONFLICT",
        "The selected space is already reserved for that time range.",
        {
          available_windows: availability.availableWindows.map((window) => ({
            starts_at: window.startsAt.toISOString(),
            ends_at: window.endsAt.toISOString()
          }))
        }
      );
    }
  }

  private assertValidDateOnly(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError(
        400,
        "INVALID_AVAILABILITY_DATE",
        "Availability date must use YYYY-MM-DD format."
      );
    }
  }

  private async getSpaceContext(
    spaceId: string
  ): Promise<{ space: NonNullable<Awaited<ReturnType<SpaceRepository["findById"]>>>; timezone: string }> {
    const space = await this.spaceRepository.findById(spaceId);

    if (!space) {
      throw new AppError(404, "SPACE_NOT_FOUND", "Space not found.");
    }

    const place = await this.placeRepository.findById(space.placeId);

    if (!place) {
      throw new AppError(404, "PLACE_NOT_FOUND", "Place not found.");
    }

    return { space, timezone: place.timezone };
  }

  private async getTimezoneForSpace(spaceId: string): Promise<string> {
    const { timezone } = await this.getSpaceContext(spaceId);
    return timezone;
  }

  private async assertWeeklyLimit(
    customerEmail: string,
    startsAt: Date,
    excludeReservationId?: string,
    reservationRepository: Pick<
      ReservationRepository,
      "countActiveByCustomerEmailBetween"
    > = this.reservationRepository
  ): Promise<void> {
    const weekRange = getPanamaWeekRange(startsAt);
    const activeCount = await reservationRepository.countActiveByCustomerEmailBetween(
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

  private async resolveCreateConflictAfterRetryableFailure(
    input: CreateReservationInput
  ): Promise<never> {
    try {
      await this.assertNoConflict(input.spaceId, input.startsAt, input.endsAt);
      await this.assertWeeklyLimit(input.customerEmail, input.startsAt);
    } catch (error) {
      throw error;
    }

    throw new AppError(
      409,
      "RESERVATION_CONFLICT",
      "Reservation creation conflicted with another concurrent request. Please retry."
    );
  }
}

const isRetryableTransactionError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "P2034";

const getDayOfWeek = (date: string, timezone: string): number => {
  const noon = zonedDateTimeToUtc(date, "12:00", timezone);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short"
  }).format(noon);
  const days: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return days[weekday] ?? noon.getUTCDay();
};

const getDateInTimezone = (date: Date, timezone: string): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const zonedDateTimeToUtc = (
  date: string,
  time: string,
  timezone: string
): Date => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute);
  let result = new Date(targetUtc);

  for (let iteration = 0; iteration < 2; iteration += 1) {
    const parts = getZonedParts(result, timezone);
    const zonedUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute
    );
    result = new Date(result.getTime() - (zonedUtc - targetUtc));
  }

  return result;
};

const getZonedParts = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute)
  };
};

const buildAvailableWindows = (
  opensAt: Date,
  closesAt: Date,
  reservedWindows: Array<{ startsAt: Date; endsAt: Date }>
) => {
  const windows: Array<{ startsAt: Date; endsAt: Date }> = [];
  let cursor = opensAt;

  for (const reserved of reservedWindows) {
    if (cursor < reserved.startsAt) {
      windows.push({ startsAt: cursor, endsAt: reserved.startsAt });
    }
    if (reserved.endsAt > cursor) {
      cursor = reserved.endsAt;
    }
  }

  if (cursor < closesAt) {
    windows.push({ startsAt: cursor, endsAt: closesAt });
  }

  return windows;
};

const minDate = (left: Date, right: Date): Date =>
  left < right ? left : right;

const maxDate = (left: Date, right: Date): Date =>
  left > right ? left : right;
