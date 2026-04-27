import { apiClient } from "../../../shared/api/client";
import {
  alertListResponseSchema,
  type Alert
} from "../schemas/alert";
import {
  deviceDesiredSchema,
  type DeviceDesired
} from "../schemas/device";
import {
  monitoringSnapshotSchema,
  type MonitoringSnapshot
} from "../schemas/monitoring";

export type UpdateDeviceDesiredInput = {
  spaceId: string;
  samplingIntervalSec: number;
  co2AlertThreshold: number;
};

export const monitoringApi = {
  getMonitoring: async (spaceId: string): Promise<MonitoringSnapshot> => {
    const { data } = await apiClient.get(
      `/admin/spaces/${spaceId}/monitoring`
    );
    return monitoringSnapshotSchema.parse(data);
  },
  listAlerts: async (spaceId: string): Promise<Alert[]> => {
    const { data } = await apiClient.get(`/admin/spaces/${spaceId}/alerts`);
    return alertListResponseSchema.parse(data).data;
  },
  updateDeviceDesired: async ({
    spaceId,
    samplingIntervalSec,
    co2AlertThreshold
  }: UpdateDeviceDesiredInput): Promise<DeviceDesired> => {
    const { data } = await apiClient.patch(
      `/admin/spaces/${spaceId}/device_desired`,
      {
        sampling_interval_sec: samplingIntervalSec,
        co2_alert_threshold: co2AlertThreshold
      }
    );
    return deviceDesiredSchema.parse(data);
  }
};
