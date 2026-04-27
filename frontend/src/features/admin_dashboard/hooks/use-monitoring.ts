import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  monitoringApi,
  type UpdateDeviceDesiredInput
} from "../api/monitoring-api";

export const monitoringQueryKeys = {
  all: ["admin", "monitoring"] as const,
  snapshot: (spaceId: string) =>
    [...monitoringQueryKeys.all, "snapshot", spaceId] as const,
  alerts: (spaceId: string) =>
    [...monitoringQueryKeys.all, "alerts", spaceId] as const
};

export const useMonitoring = (spaceId: string | undefined) =>
  useQuery({
    queryKey: monitoringQueryKeys.snapshot(spaceId ?? ""),
    queryFn: () => monitoringApi.getMonitoring(spaceId as string),
    enabled: typeof spaceId === "string" && spaceId.length > 0
  });

export const useAlerts = (spaceId: string | undefined) =>
  useQuery({
    queryKey: monitoringQueryKeys.alerts(spaceId ?? ""),
    queryFn: () => monitoringApi.listAlerts(spaceId as string),
    enabled: typeof spaceId === "string" && spaceId.length > 0
  });

export const useUpdateDeviceDesired = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDeviceDesiredInput) =>
      monitoringApi.updateDeviceDesired(input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: monitoringQueryKeys.snapshot(variables.spaceId)
      });
    }
  });
};
