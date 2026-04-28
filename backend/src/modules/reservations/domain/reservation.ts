export type ReservationStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";

export type Reservation = {
  id: string;
  placeId: string;
  spaceId: string;
  customerEmail: string;
  startsAt: Date;
  endsAt: Date;
  status: ReservationStatus;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateReservationInput = {
  placeId: string;
  spaceId: string;
  customerEmail: string;
  startsAt: Date;
  endsAt: Date;
};

export type UpdateReservationInput = Partial<CreateReservationInput>;

export type ReservationListInput = {
  page: number;
  pageSize: number;
};

export type ReservationPage = {
  data: Reservation[];
  total: number;
  page: number;
  pageSize: number;
};

export type ReservationTimeWindow = {
  startsAt: Date;
  endsAt: Date;
};

export type ReservedTimeWindow = ReservationTimeWindow & {
  reservationId: string;
};

export type DailyAvailability = {
  spaceId: string;
  date: string;
  timezone: string;
  officeHours: {
    opensAt: string | null;
    closesAt: string | null;
    isEnabled: boolean;
  };
  reservedWindows: ReservedTimeWindow[];
  availableWindows: ReservationTimeWindow[];
};
