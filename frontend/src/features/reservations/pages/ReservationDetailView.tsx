import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useState, type ReactNode } from "react";

import { normalizeApiError } from "../../../shared/api/errors";
import { uiTerms } from "../../../shared/i18n";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  Button,
  buttonClasses,
  CalendarIcon,
  Card,
  ChevronLeftIcon,
  ClockIcon,
  ErrorState,
  MailIcon,
  Modal,
  PageHeader,
  Skeleton,
  TrashIcon
} from "../../../shared/ui";
import { usePlace } from "../../places";
import { useSpace } from "../../spaces";
import { ReservationStatusBadge } from "../components/ReservationStatusBadge";
import {
  useCancelReservation,
  useDeleteReservation,
  useReservation
} from "../hooks/use-reservations";
import {
  formatDateTime,
  formatDateTimeRange,
  formatDuration
} from "../utils/date-format";

export const ReservationDetailView = () => {
  const { reservation_id: reservationId } = useParams<{
    reservation_id: string;
  }>();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const reservationQuery = useReservation(reservationId);
  const reservation = reservationQuery.data;
  const spaceQuery = useSpace(reservation?.spaceId);
  const placeQuery = usePlace(reservation?.placeId);
  const cancelMutation = useCancelReservation();
  const deleteMutation = useDeleteReservation();

  const handleCancel = () => {
    if (!reservation) return;
    cancelMutation.mutate(reservation.id, {
      onSuccess: () => {
        setShowCancelModal(false);
        toast.success("Reserva cancelada.");
      },
      onError: (error) => toast.error(normalizeApiError(error).message)
    });
  };

  const handleDelete = () => {
    if (!reservation) return;
    deleteMutation.mutate(reservation.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        toast.success("Reserva eliminada.");
        navigate("/reservations");
      },
      onError: (error) => toast.error(normalizeApiError(error).message)
    });
  };

  return (
    <section className="space-y-8">
      <Link
        to="/reservations"
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-1 text-sm font-semibold text-slate-500 transition hover:text-brand-700"
      >
        <ChevronLeftIcon size={16} />
        Volver a reservas
      </Link>

      {reservationQuery.isLoading ? (
        <Skeleton
          className="h-80"
          aria-busy="true"
          aria-label={uiTerms.a11y.loadingReservation}
        />
      ) : reservationQuery.isError ? (
        <ErrorState
          title="Reserva no disponible"
          message={normalizeApiError(reservationQuery.error).message}
          onRetry={() => reservationQuery.refetch()}
        />
      ) : reservation ? (
        <>
          <PageHeader
            eyebrow="Detalle de reserva"
            title={spaceQuery.data?.name ?? "Reserva"}
            description={formatDateTimeRange(reservation.startsAt, reservation.endsAt)}
            actions={
              <div className="flex flex-wrap gap-2">
                {reservation.status === "ACTIVE" ? (
                  <Button
                    variant="danger"
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelMutation.isPending}
                  >
                    {uiTerms.actions.cancel}
                  </Button>
                ) : null}
                {reservation.status === "CANCELLED" ? (
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleteMutation.isPending}
                  >
                    <TrashIcon size={16} />
                    {uiTerms.actions.delete}
                  </Button>
                ) : null}
                <Link
                  to="/reservations/new"
                  className={buttonClasses("primary", "md")}
                >
                  {uiTerms.actions.newReservation}
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            }
          />

          <Card className="border-amber-200 bg-amber-50/80 p-5 text-amber-900">
            <div className="flex gap-3">
              <AlertCircleIcon size={20} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm font-semibold leading-6">
                Las reservas no se pueden editar. Si algo está mal, cancela esta
                reserva y crea una nueva.
              </p>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
                    {placeQuery.data?.name ?? "Lugar pendiente..."}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {reservation.customerEmail}
                  </h1>
                </div>
                <ReservationStatusBadge status={reservation.status} />
              </div>

              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                <DetailField
                  icon={<MailIcon size={18} />}
                  label="Cliente"
                  value={reservation.customerEmail}
                />
                <DetailField
                  icon={<CalendarIcon size={18} />}
                  label="Oficina"
                  value={spaceQuery.data?.name ?? reservation.spaceId}
                />
                <DetailField
                  icon={<ClockIcon size={18} />}
                  label="Rango reservado"
                  value={formatDateTimeRange(reservation.startsAt, reservation.endsAt)}
                />
                <DetailField
                  icon={<ClockIcon size={18} />}
                  label="Duración"
                  value={formatDuration(reservation.startsAt, reservation.endsAt)}
                />
              </dl>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold text-slate-950">Cronología</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <TimelineField label="Creada" value={formatDateTime(reservation.createdAt)} />
                <TimelineField label="Actualizada" value={formatDateTime(reservation.updatedAt)} />
                <TimelineField
                  label="Cancelada"
                  value={
                    reservation.cancelledAt
                      ? formatDateTime(reservation.cancelledAt)
                      : "No cancelada"
                  }
                />
              </dl>
            </Card>
          </div>

          <Modal
            isOpen={showCancelModal}
            title={uiTerms.actions.cancelReservation}
            description="Esto marca la reserva como cancelada. Una reserva cancelada se puede eliminar después."
            onClose={() => setShowCancelModal(false)}
            actions={
              <>
                <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
                  {uiTerms.actions.keepReservation}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                >
                  {uiTerms.actions.confirmCancel}
                </Button>
              </>
            }
          />

          <Modal
            isOpen={showDeleteModal}
            title={uiTerms.actions.deleteReservation}
            description="Esto elimina permanentemente la reserva cancelada del sistema."
            onClose={() => setShowDeleteModal(false)}
            actions={
              <>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                  {uiTerms.actions.keepRecord}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {uiTerms.actions.confirmDelete}
                </Button>
              </>
            }
          />
        </>
      ) : null}
    </section>
  );
};

const DetailField = ({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
    <dt className="mt-0.5 text-brand-600">{icon}</dt>
    <dd className="min-w-0">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </dd>
  </div>
);

const TimelineField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4">
    <dt className="text-slate-500">{label}</dt>
    <dd className="text-right font-semibold text-slate-950">{value}</dd>
  </div>
);
