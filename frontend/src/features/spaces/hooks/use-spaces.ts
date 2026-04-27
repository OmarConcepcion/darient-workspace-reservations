import { useQuery } from "@tanstack/react-query";

import { spacesApi } from "../api/spaces-api";

export const spacesQueryKeys = {
  all: ["spaces"] as const,
  list: () => [...spacesQueryKeys.all, "list"] as const,
  detail: (spaceId: string) => [...spacesQueryKeys.all, "detail", spaceId] as const
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
