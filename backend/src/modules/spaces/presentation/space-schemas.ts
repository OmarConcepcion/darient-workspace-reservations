import { z } from "zod";

export const spaceIdParamsSchema = z.object({
  space_id: z.string().uuid()
});

export const createSpaceSchema = z.object({
  place_id: z.string().uuid(),
  iot_office_id: z.string().min(1),
  name: z.string().min(1),
  location_reference: z.string().min(1).nullable().optional(),
  capacity: z.number().int().positive(),
  description: z.string().min(1).nullable().optional()
});

export const updateSpaceSchema = createSpaceSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required."
);
