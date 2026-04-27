import type { Place } from "../domain/place.js";

export const toPlaceResponse = (place: Place) => ({
  id: place.id,
  iot_site_id: place.iotSiteId,
  name: place.name,
  latitude: place.latitude,
  longitude: place.longitude,
  timezone: place.timezone,
  created_at: place.createdAt.toISOString(),
  updated_at: place.updatedAt.toISOString()
});
