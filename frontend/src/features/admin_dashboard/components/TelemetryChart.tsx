import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { formatUiTime } from "../../../shared/i18n";
import { Card } from "../../../shared/ui";

export type TelemetryChartPoint = {
  time: string;
  co2: number;
  occupancy: number;
};

type TelemetryChartProps = {
  points: TelemetryChartPoint[];
  isLive: boolean;
};

const formatTimeTick = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatUiTime(date, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
};

export const TelemetryChart = ({ points, isLive }: TelemetryChartProps) => (
  <Card>
    <div className="space-y-5 p-5 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Telemetría en vivo
          </h3>
          <p className="text-xs text-slate-500">
            Ventana móvil con CO₂ promedio y ocupación máxima.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
            isLive
              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
              : "bg-slate-100 text-slate-600 ring-slate-200"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isLive ? "animate-pulse bg-emerald-500" : "bg-slate-400"
            }`}
          />
          {isLive ? "En vivo" : "Sin conexión"}
        </span>
      </header>

      {points.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-sm text-slate-500">
          Esperando telemetría…
        </div>
      ) : (
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer>
            <LineChart
              data={points}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={formatTimeTick}
                stroke="#cbd5f5"
              />
              <YAxis
                yAxisId="co2"
                tick={{ fontSize: 11, fill: "#64748b" }}
                stroke="#cbd5f5"
                width={42}
              />
              <YAxis
                yAxisId="occupancy"
                orientation="right"
                tick={{ fontSize: 11, fill: "#64748b" }}
                stroke="#cbd5f5"
                width={28}
                allowDecimals={false}
              />
              <Tooltip
                labelFormatter={(value) =>
                  typeof value === "string" ? formatTimeTick(value) : ""
                }
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12
                }}
              />
              <Line
                yAxisId="co2"
                type="monotone"
                dataKey="co2"
                name="CO₂ ppm"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="occupancy"
                type="monotone"
                dataKey="occupancy"
                name="Ocupación"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  </Card>
);
