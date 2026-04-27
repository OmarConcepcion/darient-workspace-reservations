import type { ReservationStatus } from "../schemas/reservation";

const styles: Record<ReservationStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-slate-200 text-slate-700",
  EXPIRED: "bg-amber-100 text-amber-800"
};

const labels: Record<ReservationStatus, string> = {
  ACTIVE: "Active",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired"
};

type ReservationStatusBadgeProps = {
  status: ReservationStatus;
};

export const ReservationStatusBadge = ({ status }: ReservationStatusBadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
  >
    {labels[status]}
  </span>
);
