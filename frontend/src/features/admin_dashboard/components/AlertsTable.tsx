import { Card, EmptyState, InboxIcon } from "../../../shared/ui";
import type { Alert } from "../schemas/alert";
import { AlertStatusBadge, AlertTypeBadge } from "./AlertStatusBadge";

type AlertsTableProps = {
  alerts: Alert[];
};

export const AlertsTable = ({ alerts }: AlertsTableProps) => {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<InboxIcon size={20} />}
        title="No alerts on record"
        description="When CO₂, occupancy or unexpected-presence rules trigger, alerts will show up here."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[760px] divide-y divide-slate-200/80 text-sm lg:min-w-full">
          <thead className="bg-slate-50/70 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3">
                Type
              </th>
              <th scope="col" className="px-5 py-3">
                Status
              </th>
              <th scope="col" className="px-5 py-3">
                Started
              </th>
              <th scope="col" className="px-5 py-3">
                Resolved
              </th>
              <th scope="col" className="px-5 py-3">
                Detail
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alerts.map((alert) => (
              <tr
                key={alert.alertId}
                className="transition hover:bg-slate-50/70"
              >
                <td className="px-5 py-4">
                  <AlertTypeBadge type={alert.type} />
                </td>
                <td className="px-5 py-4">
                  <AlertStatusBadge status={alert.status} />
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {new Date(alert.startedAt).toLocaleString()}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {alert.resolvedAt
                    ? new Date(alert.resolvedAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-600">
                  {alert.metadata
                    ? formatMetadata(alert.metadata)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const formatMetadata = (metadata: unknown): string => {
  if (typeof metadata !== "object" || metadata === null) {
    return String(metadata);
  }
  const entries = Object.entries(metadata as Record<string, unknown>);
  if (entries.length === 0) return "—";
  return entries
    .slice(0, 2)
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(" · ");
};

const formatValue = (value: unknown): string => {
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};
