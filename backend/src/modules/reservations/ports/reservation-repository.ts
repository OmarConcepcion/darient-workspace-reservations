import type {
  CreateReservationInput,
  Reservation,
  ReservationListInput,
  ReservationStatus,
  UpdateReservationInput
} from "../domain/reservation.js";

export type PersistedReservationUpdateInput = UpdateReservationInput & {
  status?: ReservationStatus;
  cancelledAt?: Date | null;
};

export type ReservationRepository = {
  create(input: CreateReservationInput): Promise<Reservation>;
  findById(id: string): Promise<Reservation | null>;
  findPaginated(input: ReservationListInput): Promise<{
    data: Reservation[];
    total: number;
  }>;
  update(
    id: string,
    input: PersistedReservationUpdateInput
  ): Promise<Reservation | null>;
  delete(id: string): Promise<boolean>;
  findActiveBySpaceBetween(
    spaceId: string,
    startsAt: Date,
    endsAt: Date
  ): Promise<Reservation[]>;
  findActiveOverlaps(
    spaceId: string,
    startsAt: Date,
    endsAt: Date,
    excludeReservationId?: string
  ): Promise<Reservation[]>;
  countActiveByCustomerEmailBetween(
    customerEmail: string,
    startsAt: Date,
    endsAt: Date,
    excludeReservationId?: string
  ): Promise<number>;
  runInSerializableTransaction<T>(
    operation: (repository: ReservationRepository) => Promise<T>
  ): Promise<T>;
};
