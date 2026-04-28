import { useQuery } from "@tanstack/react-query";

import { spacesApi } from "../api/spaces-api";

export const spacesQueryKeys = {
  all: ["spaces"] as const,
  list: () => [...spacesQueryKeys.all, "list"] as const,
  detail: (spaceId: string) => [...spacesQueryKeys.all, "detail", spaceId] as const,
  availability: (spaceId: string, date: string) =>
    [...spacesQueryKeys.all, "availability", spaceId, date] as const
};

export const useSpaces = () =>
  useQuery({
    queryKey: spacesQueryKeys.list(),
    queryFn: spacesApi.list
  });

export const useSpace = (spaceId: string | undefined) =>
  useQuery({
    queryKey: spacesQueryKeys.detail(spaceId ?? ""),
    queryFn: () => spacesApi.get(spaceId as string),
    enabled: typeof spaceId === "string" && spaceId.length > 0
  });

export const useSpaceAvailability = (
  spaceId: string | undefined,
  date: string
) =>
  useQuery({
    queryKey: spacesQueryKeys.availability(spaceId ?? "", date),
    queryFn: () => spacesApi.availability(spaceId as string, date),
    enabled:
      typeof spaceId === "string" &&
      spaceId.length > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(date)
  });
