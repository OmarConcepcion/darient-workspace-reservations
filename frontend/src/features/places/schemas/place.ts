import { z } from "zod";

export const placeWireSchema = z.object({
  id: z.string(),
  iot_site_id: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

export const placeSchema = placeWireSchema.transform((raw) => ({
  id: raw.id,
  iotSiteId: raw.iot_site_id,
  name: raw.name,
  latitude: raw.latitude,
  longitude: raw.longitude,
  timezone: raw.timezone,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at
}));

export type Place = z.output<typeof placeSchema>;
