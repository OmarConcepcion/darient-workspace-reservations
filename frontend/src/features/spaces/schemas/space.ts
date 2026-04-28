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

const timeWindowWireSchema = z.object({
  starts_at: z.string(),
  ends_at: z.string()
});

export const spaceAvailabilityWireSchema = z.object({
  space_id: z.string(),
  date: z.string(),
  timezone: z.string(),
  office_hours: z.object({
    opens_at: z.string().nullable(),
    closes_at: z.string().nullable(),
    is_enabled: z.boolean()
  }),
  reserved_windows: z.array(
    timeWindowWireSchema.extend({
      reservation_id: z.string()
    })
  ),
  available_windows: z.array(timeWindowWireSchema)
});

export const spaceAvailabilitySchema = spaceAvailabilityWireSchema.transform(
  (raw) => ({
    spaceId: raw.space_id,
    date: raw.date,
    timezone: raw.timezone,
    officeHours: {
      opensAt: raw.office_hours.opens_at,
      closesAt: raw.office_hours.closes_at,
      isEnabled: raw.office_hours.is_enabled
    },
    reservedWindows: raw.reserved_windows.map((window) => ({
      reservationId: window.reservation_id,
      startsAt: window.starts_at,
      endsAt: window.ends_at
    })),
    availableWindows: raw.available_windows.map((window) => ({
      startsAt: window.starts_at,
      endsAt: window.ends_at
    }))
  })
);

export type SpaceAvailability = z.output<typeof spaceAvailabilitySchema>;
