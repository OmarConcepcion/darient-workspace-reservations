import type { DailyAvailability, Reservation } from "../domain/reservation.js";

export const toReservationResponse = (reservation: Reservation) => ({
  id: reservation.id,
  place_id: reservation.placeId,
  space_id: reservation.spaceId,
  customer_email: reservation.customerEmail,
  starts_at: reservation.startsAt.toISOString(),
  ends_at: reservation.endsAt.toISOString(),
  status: reservation.status,
  cancelled_at: reservation.cancelledAt?.toISOString() ?? null,
  created_at: reservation.createdAt.toISOString(),
  updated_at: reservation.updatedAt.toISOString()
});

export const toAvailabilityResponse = (availability: DailyAvailability) => ({
  space_id: availability.spaceId,
  date: availability.date,
  timezone: availability.timezone,
  office_hours: {
    opens_at: availability.officeHours.opensAt,
    closes_at: availability.officeHours.closesAt,
    is_enabled: availability.officeHours.isEnabled
  },
  reserved_windows: availability.reservedWindows.map((window) => ({
    reservation_id: window.reservationId,
    starts_at: window.startsAt.toISOString(),
    ends_at: window.endsAt.toISOString()
  })),
  available_windows: availability.availableWindows.map((window) => ({
    starts_at: window.startsAt.toISOString(),
    ends_at: window.endsAt.toISOString()
  }))
});
