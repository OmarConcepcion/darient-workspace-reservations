import { z } from "zod";

import { apiClient } from "../../../shared/api/client";
import { spaceSchema, type Space } from "../schemas/space";

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
  }
};
