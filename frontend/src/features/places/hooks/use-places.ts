import { useQuery } from "@tanstack/react-query";

import { placesApi } from "../api/places-api";

export const placesQueryKeys = {
  all: ["places"] as const,
  list: () => [...placesQueryKeys.all, "list"] as const,
  detail: (placeId: string) => [...placesQueryKeys.all, "detail", placeId] as const
};

export const usePlaces = () =>
  useQuery({
    queryKey: placesQueryKeys.list(),
    queryFn: placesApi.list
  });

export const usePlace = (placeId: string | undefined) =>
  useQuery({
    queryKey: placesQueryKeys.detail(placeId ?? ""),
    queryFn: () => placesApi.get(placeId as string),
    enabled: typeof placeId === "string" && placeId.length > 0
  });
