import type { Space } from "../domain/space.js";

export const toSpaceResponse = (space: Space) => ({
  id: space.id,
  place_id: space.placeId,
  iot_office_id: space.iotOfficeId,
  name: space.name,
  location_reference: space.locationReference,
  capacity: space.capacity,
  description: space.description,
  created_at: space.createdAt.toISOString(),
  updated_at: space.updatedAt.toISOString()
});
