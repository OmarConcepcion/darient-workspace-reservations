import { z } from "zod";

import { apiClient } from "../../../shared/api/client";
import { placeSchema, type Place } from "../schemas/place";

const placeListResponseSchema = z.object({
  data: z.array(placeSchema)
});

export const placesApi = {
  list: async (): Promise<Place[]> => {
    const { data } = await apiClient.get("/places");
    return placeListResponseSchema.parse(data).data;
  },
  get: async (placeId: string): Promise<Place> => {
    const { data } = await apiClient.get(`/places/${placeId}`);
    return placeSchema.parse(data);
  }
};
