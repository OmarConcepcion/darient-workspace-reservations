import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  formatActiveAlertsLabel,
  uiTerms
} from "../../../shared/i18n";
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
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-1 text-sm font-semibold text-slate-500 transition hover:text-brand-700"
      >
        <ChevronLeftIcon size={16} />
        Volver a admin
      </Link>

      {monitoringQuery.isLoading ? (
        <Skeleton
          className="h-64"
          aria-busy="true"
          aria-label={uiTerms.a11y.loadingMonitoring}
        />
      ) : monitoringQuery.isError ? (
        <ErrorState
          title="No pudimos cargar el monitoreo"
          message={normalizeApiError(monitoringQuery.error).message}
          onRetry={() => monitoringQuery.refetch()}
        />
      ) : snapshot ? (
        <>
          <PageHeader
            eyebrow={`${snapshot.iotSiteId} · ${snapshot.iotOfficeId}`}
            title={`Oficina ${snapshot.iotOfficeId}`}
            description={`Capacidad ${snapshot.capacity} · ${snapshot.timezone}`}
            actions={
              <Badge tone={snapshot.activeAlerts.length > 0 ? "danger" : "success"}>
                <AlertCircleIcon size={12} />
                {formatActiveAlertsLabel(snapshot.activeAlerts.length)}
              </Badge>
            }
          />

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="CO₂ prom."
              value={stats.co2 !== null ? `${stats.co2} ppm` : "—"}
              hint={stats.maxCo2 !== null ? `Máx. ${stats.maxCo2} ppm` : undefined}
              tone="brand"
              icon={<ActivityIcon size={16} />}
            />
            <StatCard
              label="Ocupación máx."
              value={
                stats.occupancy !== null
                  ? `${stats.occupancy} / ${snapshot.capacity}`
                  : "—"
              }
              hint="Última ventana agregada"
              tone="warning"
              icon={<UsersIcon size={16} />}
            />
            <StatCard
              label="Temp. prom."
              value={stats.temp !== null ? `${stats.temp} °C` : "—"}
              hint={stats.humidity !== null ? `${stats.humidity}% de humedad` : undefined}
            />
            <StatCard
              label="Potencia"
              value={stats.power !== null ? `${stats.power} W` : "—"}
              hint="Última lectura"
              icon={<CpuIcon size={16} />}
            />
          </div>

          <TelemetryChart points={points} isLive={status === "open" || status === "connecting"} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
            <div className="min-w-0">
              <DeviceReportedPanel
                desired={snapshot.deviceDesired}
                reported={snapshot.deviceReported}
              />
            </div>
            <div className="min-w-0">
              <DeviceDesiredForm
                spaceId={snapshot.spaceId}
                desired={snapshot.deviceDesired}
              />
            </div>
          </div>

          <section className="space-y-3">
            <header>
              <h2 className="text-lg font-semibold text-slate-900">Alertas</h2>
              <p className="text-sm text-slate-500">
                Primero se muestran las alertas abiertas y luego el historial resuelto.
              </p>
            </header>
            {alertsQuery.isLoading ? (
              <Skeleton className="h-40" />
            ) : alertsQuery.isError ? (
              <ErrorState
                title="No pudimos cargar las alertas"
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
