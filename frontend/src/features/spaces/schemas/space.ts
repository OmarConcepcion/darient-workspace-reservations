import { z } from "zod";

export const spaceWireSchema = z.object({
  id: z.string(),
  place_id: z.string(),
  iot_office_id: z.string(),
  name: z.string(),
  location_reference: z.string().nullable(),
  capacity: z.number().int(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

export const spaceSchema = spaceWireSchema.transform((raw) => ({
  id: raw.id,
  placeId: raw.place_id,
  iotOfficeId: raw.iot_office_id,
  name: raw.name,
  locationReference: raw.location_reference,
  capacity: raw.capacity,
  description: raw.description,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at
}));

export type Space = z.output<typeof spaceSchema>;
