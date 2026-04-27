import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { normalizeApiError } from "../../../shared/api/errors";
import {
  Button,
  buttonClasses,
  Card,
  CalendarIcon,
  EmptyState,
  ErrorState,
  PageHeader,
  PlusIcon,
  Skeleton
} from "../../../shared/ui";
import { useSpaces, type Space } from "../../spaces";
import { ReservationStatusBadge } from "../components/ReservationStatusBadge";
import {
  useCancelReservation,
  useReservations
} from "../hooks/use-reservations";
import type { Reservation } from "../schemas/reservation";

const PAGE_SIZE = 10;

export const ReservationsListView = () => {
  const [page, setPage] = useState(1);
  const reservationsQuery = useReservations({ page, pageSize: PAGE_SIZE });
  const spacesQuery = useSpaces();
  const cancelMutation = useCancelReservation();

  const spacesById = useMemo(() => {
    const map = new Map<string, Space>();
    for (const space of spacesQuery.data ?? []) {
      map.set(space.id, space);
    }
    return map;
  }, [spacesQuery.data]);

  const handleCancel = (reservation: Reservation) => {
    cancelMutation.mutate(reservation.id, {
      onSuccess: () => toast.success("Reservation cancelled."),
      onError: (error) => toast.error(normalizeApiError(error).message)
    });
  };

  const total = reservationsQuery.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const reservations = reservationsQuery.data?.data ?? [];

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Bookings"
        title="Reservations"
        description="Existing bookings across every workspace."
        actions={
          <Link
            to="/reservations/new"
            className={buttonClasses("primary", "md")}
          >
            <PlusIcon size={16} />
            New reservation
          </Link>
        }
      />

      {reservationsQuery.isLoading ? (
        <Skeleton
          className="h-72"
          aria-busy="true"
          aria-label="Loading reservations"
        />
      ) : reservationsQuery.isError ? (
        <ErrorState
          title="We couldn’t load reservations"
          message={normalizeApiError(reservationsQuery.error).message}
          onRetry={() => reservationsQuery.refetch()}
        />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={20} />}
          title="No reservations yet"
          description="Create your first reservation to see it listed here."
          action={
            <Link
              to="/reservations/new"
              className={buttonClasses("primary", "md")}
            >
              <PlusIcon size={16} />
              New reservation
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-sm">
              <thead className="bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Space
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Window
                  </th>
                  <th scope="col" className="px-5 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {reservation.customerEmail}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {spacesById.get(reservation.spaceId)?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatRange(reservation.startsAt, reservation.endsAt)}
                    </td>
                    <td className="px-5 py-4">
                      <ReservationStatusBadge status={reservation.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {reservation.status === "ACTIVE" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCancel(reservation)}
                          disabled={
                            cancelMutation.isPending &&
                            cancelMutation.variables === reservation.id
                          }
                        >
                          {cancelMutation.isPending &&
                          cancelMutation.variables === reservation.id
                            ? "Cancelling…"
                            : "Cancel"}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {total > PAGE_SIZE ? (
        <nav
          aria-label="Reservations pagination"
          className="flex items-center justify-between text-sm text-slate-600"
        >
          <p>
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </nav>
      ) : null}
    </section>
  );
};

const formatRange = (startsAt: string, endsAt: string): string => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return `${start.toLocaleString()} → ${end.toLocaleTimeString()}`;
};
