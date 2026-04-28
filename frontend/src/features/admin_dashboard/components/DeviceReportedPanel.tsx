import { devicePublishStatusLabels, formatUiDateTime } from "../../../shared/i18n";
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
  PENDING: { label: devicePublishStatusLabels.PENDING, tone: "warning" },
  PUBLISHED: { label: devicePublishStatusLabels.PUBLISHED, tone: "success" },
  FAILED: { label: devicePublishStatusLabels.FAILED, tone: "danger" }
};

export const DeviceReportedPanel = ({
  desired,
  reported
}: DeviceReportedPanelProps) => (
  <Card>
    <div className="space-y-5 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Estado del dispositivo</h3>
          <p className="text-xs text-slate-500">
            Compara lo solicitado con lo último que reportó el dispositivo.
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
          title="Deseado"
          eyebrow="Configuración del backend"
          rows={
            desired
              ? [
                  {
                    label: "Intervalo de muestreo",
                    value: `${desired.samplingIntervalSec} s`
                  },
                  {
                    label: "Umbral de CO₂",
                    value: `${desired.co2AlertThreshold} ppm`
                  },
                  {
                    label: "Última publicación",
                    value: desired.lastPublishedAt
                      ? formatUiDateTime(desired.lastPublishedAt, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "—"
                  }
                ]
              : null
          }
          fallback="Todavía no hay estado deseado"
          footer={
            desired?.publishStatus === "FAILED" && desired.publishError ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-100">
                Último error de publicación: {desired.publishError}
              </p>
            ) : null
          }
        />
        <StateColumn
          title="Reportado"
          eyebrow="Última sincronización del dispositivo"
          rows={
            reported
              ? [
                  {
                    label: "Intervalo de muestreo",
                    value: `${reported.samplingIntervalSec} s`
                  },
                  {
                    label: "Umbral de CO₂",
                    value: `${reported.co2AlertThreshold} ppm`
                  },
                  {
                    label: "Firmware",
                    value: reported.firmwareVersion
                  },
                  {
                    label: "Reportado en",
                    value: formatUiDateTime(reported.reportedAt, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  }
                ]
              : null
          }
          fallback="El dispositivo todavía no ha reportado"
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
          <div key={row.label} className="flex items-start justify-between gap-3">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="min-w-0 text-right font-medium text-slate-900">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    ) : (
      <p className="text-sm text-slate-500">{fallback}</p>
    )}
    {footer}
  </div>
);
