import { reservationStatusLabels } from "../../../shared/i18n";
import { Badge, type BadgeTone } from "../../../shared/ui";
import type { ReservationStatus } from "../schemas/reservation";

const tones: Record<ReservationStatus, BadgeTone> = {
  ACTIVE: "success",
  CANCELLED: "muted",
  EXPIRED: "warning"
};

type ReservationStatusBadgeProps = {
  status: ReservationStatus;
};

export const ReservationStatusBadge = ({
  status
}: ReservationStatusBadgeProps) => (
  <Badge tone={tones[status]}>{reservationStatusLabels[status]}</Badge>
);
