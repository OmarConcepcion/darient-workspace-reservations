import { z } from "zod";

import { apiClient } from "../../../shared/api/client";
import {
  spaceAvailabilitySchema,
  spaceSchema,
  type Space,
  type SpaceAvailability
} from "../schemas/space";

const spaceListResponseSchema = z.object({
  data: z.array(spaceSchema)
});

export const spacesApi = {
  list: async (): Promise<Space[]> => {
    const { data } = await apiClient.get("/spaces");
    return spaceListResponseSchema.parse(data).data;
  },
  get: async (spaceId: string): Promise<Space> => {
    const { data } = await apiClient.get(`/spaces/${spaceId}`);
    return spaceSchema.parse(data);
  },
  availability: async (
    spaceId: string,
    date: string
  ): Promise<SpaceAvailability> => {
    const { data } = await apiClient.get(`/spaces/${spaceId}/availability`, {
      params: { date }
    });
    return spaceAvailabilitySchema.parse(data);
  }
};
