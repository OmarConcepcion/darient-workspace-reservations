import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { normalizeApiError } from "../../../shared/api/errors";
import {
  ActivityIcon,
  AlertCircleIcon,
  Badge,
  ChevronLeftIcon,
  CpuIcon,
  ErrorState,
  PageHeader,
  Skeleton,
  UsersIcon
} from "../../../shared/ui";
import { AlertsTable } from "../components/AlertsTable";
import { DeviceDesiredForm } from "../components/DeviceDesiredForm";
import { DeviceReportedPanel } from "../components/DeviceReportedPanel";
import { StatCard } from "../components/StatCard";
import {
  TelemetryChart,
  type TelemetryChartPoint
} from "../components/TelemetryChart";
import {
  monitoringQueryKeys,
  useAlerts,
  useMonitoring
} from "../hooks/use-monitoring";
import { useEventStream } from "../hooks/use-event-stream";

const MAX_POINTS = 30;

export const SpaceMonitoringView = () => {
  const { space_id: spaceId } = useParams<{ space_id: string }>();
  const queryClient = useQueryClient();

  const monitoringQuery = useMonitoring(spaceId);
  const alertsQuery = useAlerts(spaceId);
  const snapshot = monitoringQuery.data;

  const [points, setPoints] = useState<TelemetryChartPoint[]>([]);

  useEffect(() => {
    const latest = snapshot?.latestTelemetry;
    if (!latest) return;
    setPoints((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.time === latest.windowStart) return prev;
      return [
        ...prev,
        {
          time: latest.windowStart,
          co2: Math.round(latest.avgCo2Ppm),
          occupancy: latest.maxOccupancy
        }
      ].slice(-MAX_POINTS);
    });
  }, [snapshot?.latestTelemetry?.windowStart]);

  const status = useEventStream(
    {
      telemetry_updated: (payload) => {
        if (!spaceId || payload.space_id !== spaceId) return;
        setPoints((prev) =>
          [
            ...prev,
            {
              time: payload.window_start,
              co2: Math.round(payload.avg_co2_ppm),
              occupancy: payload.max_occupancy
            }
          ].slice(-MAX_POINTS)
        );
      },
      alert_updated: (payload) => {
        if (!spaceId || payload.space_id !== spaceId) return;
        void queryClient.invalidateQueries({
          queryKey: monitoringQueryKeys.alerts(spaceId)
        });
        void queryClient.invalidateQueries({
          queryKey: monitoringQueryKeys.snapshot(spaceId)
        });
      },
      device_reported_updated: (payload) => {
        if (!spaceId || payload.space_id !== spaceId) return;
        void queryClient.invalidateQueries({
          queryKey: monitoringQueryKeys.snapshot(spaceId)
        });
      }
    },
    { enabled: typeof spaceId === "string" && spaceId.length > 0 }
  );

  const stats = useMemo(() => {
    const telemetry = snapshot?.latestTelemetry;
    return {
      co2: telemetry ? Math.round(telemetry.avgCo2Ppm) : null,
      maxCo2: telemetry ? Math.round(telemetry.maxCo2Ppm) : null,
      occupancy: telemetry?.maxOccupancy ?? null,
      temp: telemetry ? telemetry.avgTempC.toFixed(1) : null,
      humidity: telemetry ? telemetry.avgHumidityPct.toFixed(0) : null,
      power: telemetry?.latestPowerW ?? null
    };
  }, [snapshot?.latestTelemetry]);

  return (
    <section className="space-y-8">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ChevronLeftIcon size={16} />
        Back to admin
      </Link>

      {monitoringQuery.isLoading ? (
        <Skeleton
          className="h-64"
          aria-busy="true"
          aria-label="Loading monitoring snapshot"
        />
      ) : monitoringQuery.isError ? (
        <ErrorState
          title="We couldn’t load monitoring"
          message={normalizeApiError(monitoringQuery.error).message}
          onRetry={() => monitoringQuery.refetch()}
        />
      ) : snapshot ? (
        <>
          <PageHeader
            eyebrow={`${snapshot.iotSiteId} · ${snapshot.iotOfficeId}`}
            title={`Space ${snapshot.iotOfficeId}`}
            description={`Capacity ${snapshot.capacity} · ${snapshot.timezone}`}
            actions={
              <Badge tone={snapshot.activeAlerts.length > 0 ? "danger" : "success"}>
                <AlertCircleIcon size={12} />
                {snapshot.activeAlerts.length} active{" "}
                {snapshot.activeAlerts.length === 1 ? "alert" : "alerts"}
              </Badge>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Avg CO₂"
              value={stats.co2 !== null ? `${stats.co2} ppm` : "—"}
              hint={stats.maxCo2 !== null ? `Max ${stats.maxCo2} ppm` : undefined}
              tone="brand"
              icon={<ActivityIcon size={16} />}
            />
            <StatCard
              label="Max occupancy"
              value={
                stats.occupancy !== null
                  ? `${stats.occupancy} / ${snapshot.capacity}`
                  : "—"
              }
              hint="Latest aggregation window"
              tone="warning"
              icon={<UsersIcon size={16} />}
            />
            <StatCard
              label="Avg temp"
              value={stats.temp !== null ? `${stats.temp} °C` : "—"}
              hint={stats.humidity !== null ? `${stats.humidity}% humidity` : undefined}
            />
            <StatCard
              label="Power"
              value={stats.power !== null ? `${stats.power} W` : "—"}
              hint="Latest reading"
              icon={<CpuIcon size={16} />}
            />
          </div>

          <TelemetryChart points={points} isLive={status === "open" || status === "connecting"} />

          <div className="grid gap-6 lg:grid-cols-2">
            <DeviceReportedPanel
              desired={snapshot.deviceDesired}
              reported={snapshot.deviceReported}
            />
            <DeviceDesiredForm
              spaceId={snapshot.spaceId}
              desired={snapshot.deviceDesired}
            />
          </div>

          <section className="space-y-3">
            <header>
              <h2 className="text-lg font-semibold text-slate-900">Alerts</h2>
              <p className="text-sm text-slate-500">
                Open alerts first, followed by resolved history.
              </p>
            </header>
            {alertsQuery.isLoading ? (
              <Skeleton className="h-40" />
            ) : alertsQuery.isError ? (
              <ErrorState
                title="We couldn’t load alerts"
                message={normalizeApiError(alertsQuery.error).message}
                onRetry={() => alertsQuery.refetch()}
              />
            ) : (
              <AlertsTable alerts={alertsQuery.data ?? []} />
            )}
          </section>
        </>
      ) : null}
    </section>
  );
};
