import { Badge } from "../../../shared/ui";
import type { AlertStatus, AlertType } from "../schemas/alert";

const typeLabels: Record<AlertType, string> = {
  CO2: "CO₂",
  OCCUPANCY_MAX: "Occupancy max",
  OCCUPANCY_UNEXPECTED: "Unexpected occupancy"
};

export const AlertTypeBadge = ({ type }: { type: AlertType }) => (
  <Badge tone="brand">{typeLabels[type]}</Badge>
);

export const AlertStatusBadge = ({ status }: { status: AlertStatus }) => (
  <Badge tone={status === "OPEN" ? "danger" : "muted"}>
    {status === "OPEN" ? "Open" : "Resolved"}
  </Badge>
);
