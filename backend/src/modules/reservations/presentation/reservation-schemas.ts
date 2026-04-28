import { z } from "zod";

const isoDateSchema = z.string().datetime().transform((value) => new Date(value));

export const reservationIdParamsSchema = z.object({
  reservation_id: z.string().uuid()
});

export const availabilityDateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")
});

export const listReservationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(10)
});

export const createReservationSchema = z.object({
  place_id: z.string().uuid(),
  space_id: z.string().uuid(),
  customer_email: z.string().email(),
  starts_at: isoDateSchema,
  ends_at: isoDateSchema
});

export const updateReservationSchema = createReservationSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required."
);
