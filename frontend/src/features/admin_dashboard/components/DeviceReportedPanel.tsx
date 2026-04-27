import { Badge, Card } from "../../../shared/ui";
import type {
  DeviceDesired,
  DeviceDesiredPublishStatus,
  DeviceReported
} from "../schemas/device";

type DeviceReportedPanelProps = {
  desired: DeviceDesired | null;
  reported: DeviceReported | null;
};

const publishToneLabel: Record<
  DeviceDesiredPublishStatus,
  { label: string; tone: "brand" | "success" | "warning" | "danger" }
> = {
  PENDING: { label: "Pending", tone: "warning" },
  PUBLISHED: { label: "Published", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" }
};

export const DeviceReportedPanel = ({
  desired,
  reported
}: DeviceReportedPanelProps) => (
  <Card>
    <div className="space-y-5 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Device state</h3>
          <p className="text-xs text-slate-500">
            Compare what we requested with what the device last reported.
          </p>
        </div>
        {desired ? (
          <Badge tone={publishToneLabel[desired.publishStatus].tone}>
            {publishToneLabel[desired.publishStatus].label}
          </Badge>
        ) : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StateColumn
          title="Desired"
          eyebrow="Backend setpoint"
          rows={
            desired
              ? [
                  {
                    label: "Sampling interval",
                    value: `${desired.samplingIntervalSec} s`
                  },
                  {
                    label: "CO₂ threshold",
                    value: `${desired.co2AlertThreshold} ppm`
                  },
                  {
                    label: "Last published",
                    value: desired.lastPublishedAt
                      ? new Date(desired.lastPublishedAt).toLocaleString()
                      : "—"
                  }
                ]
              : null
          }
          fallback="No desired state set yet"
          footer={
            desired?.publishStatus === "FAILED" && desired.publishError ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-100">
                Last publish error: {desired.publishError}
              </p>
            ) : null
          }
        />
        <StateColumn
          title="Reported"
          eyebrow="Last device sync"
          rows={
            reported
              ? [
                  {
                    label: "Sampling interval",
                    value: `${reported.samplingIntervalSec} s`
                  },
                  {
                    label: "CO₂ threshold",
                    value: `${reported.co2AlertThreshold} ppm`
                  },
                  {
                    label: "Firmware",
                    value: reported.firmwareVersion
                  },
                  {
                    label: "Reported at",
                    value: new Date(reported.reportedAt).toLocaleString()
                  }
                ]
              : null
          }
          fallback="Device has not reported yet"
        />
      </div>
    </div>
  </Card>
);

type StateColumnProps = {
  title: string;
  eyebrow: string;
  rows: Array<{ label: string; value: string }> | null;
  fallback: string;
  footer?: React.ReactNode;
};

const StateColumn = ({
  title,
  eyebrow,
  rows,
  fallback,
  footer
}: StateColumnProps) => (
  <div className="space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/40 p-4">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {eyebrow}
      </p>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
    </div>
    {rows ? (
      <dl className="space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="font-medium text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    ) : (
      <p className="text-sm text-slate-500">{fallback}</p>
    )}
    {footer}
  </div>
);
