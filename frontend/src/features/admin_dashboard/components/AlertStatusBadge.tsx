import { alertStatusLabels, alertTypeLabels } from "../../../shared/i18n";
import { Badge } from "../../../shared/ui";
import type { AlertStatus, AlertType } from "../schemas/alert";

export const AlertTypeBadge = ({ type }: { type: AlertType }) => (
  <Badge tone="brand">{alertTypeLabels[type]}</Badge>
);

export const AlertStatusBadge = ({ status }: { status: AlertStatus }) => (
  <Badge tone={status === "OPEN" ? "danger" : "muted"}>{alertStatusLabels[status]}</Badge>
);
