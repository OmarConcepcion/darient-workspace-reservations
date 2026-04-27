import { Badge, type BadgeTone } from "../../../shared/ui";
import type { ReservationStatus } from "../schemas/reservation";

const tones: Record<ReservationStatus, BadgeTone> = {
  ACTIVE: "success",
  CANCELLED: "muted",
  EXPIRED: "warning"
};

const labels: Record<ReservationStatus, string> = {
  ACTIVE: "Active",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired"
};

type ReservationStatusBadgeProps = {
  status: ReservationStatus;
};

export const ReservationStatusBadge = ({
  status
}: ReservationStatusBadgeProps) => (
  <Badge tone={tones[status]}>{labels[status]}</Badge>
);
