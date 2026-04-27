import { z } from "zod";

export const placeIdParamsSchema = z.object({
  place_id: z.string().uuid()
});

export const createPlaceSchema = z.object({
  iot_site_id: z.string().min(1),
  name: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().min(1).default("America/Panama")
});

export const updatePlaceSchema = createPlaceSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required."
);
