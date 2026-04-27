import type { Reservation } from "../domain/reservation.js";

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
