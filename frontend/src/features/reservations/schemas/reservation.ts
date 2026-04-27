import { z } from "zod";

export const reservationStatusSchema = z.enum([
  "ACTIVE",
  "CANCELLED",
  "EXPIRED"
]);

export type ReservationStatus = z.infer<typeof reservationStatusSchema>;

export const reservationWireSchema = z.object({
  id: z.string(),
  place_id: z.string(),
  space_id: z.string(),
  customer_email: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
  status: reservationStatusSchema,
  cancelled_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const reservationSchema = reservationWireSchema.transform((raw) => ({
  id: raw.id,
  placeId: raw.place_id,
  spaceId: raw.space_id,
  customerEmail: raw.customer_email,
  startsAt: raw.starts_at,
  endsAt: raw.ends_at,
  status: raw.status,
  cancelledAt: raw.cancelled_at,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at
}));

export type Reservation = z.output<typeof reservationSchema>;

export const reservationListResponseSchema = z.object({
  data: z.array(reservationSchema),
  pagination: z.object({
    page: z.number().int(),
    page_size: z.number().int(),
    total: z.number().int()
  })
});

export type ReservationListResponse = z.output<typeof reservationListResponseSchema>;
