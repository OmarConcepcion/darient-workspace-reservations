import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { normalizeApiError } from "../../../shared/api/errors";
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
      onSuccess: () => {
        toast.success("Reservation cancelled.");
      },
      onError: (error) => {
        toast.error(normalizeApiError(error).message);
      }
    });
  };

  const total = reservationsQuery.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Reservations</h1>
          <p className="text-sm text-slate-600">
            Existing bookings across all workspaces.
          </p>
        </div>
        <Link
          to="/reservations/new"
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          New reservation
        </Link>
      </header>

      {reservationsQuery.isLoading ? (
        <ListSkeleton />
      ) : reservationsQuery.isError ? (
        <ErrorState
          message={normalizeApiError(reservationsQuery.error).message}
          onRetry={() => reservationsQuery.refetch()}
        />
      ) : (reservationsQuery.data?.data ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Space
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Window
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reservationsQuery.data?.data.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">
                    {reservation.customerEmail}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {spacesById.get(reservation.spaceId)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatRange(reservation.startsAt, reservation.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ReservationStatusBadge status={reservation.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {reservation.status === "ACTIVE" ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(reservation)}
                        disabled={
                          cancelMutation.isPending &&
                          cancelMutation.variables === reservation.id
                        }
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancelMutation.isPending &&
                        cancelMutation.variables === reservation.id
                          ? "Cancelling…"
                          : "Cancel"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-md border border-slate-300 px-3 py-1 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages}
              className="rounded-md border border-slate-300 px-3 py-1 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
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

const ListSkeleton = () => (
  <div
    aria-busy="true"
    aria-label="Loading reservations"
    className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white"
  />
);

const EmptyState = () => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
    <h2 className="text-base font-semibold text-slate-900">No reservations yet</h2>
    <p className="mt-1 text-sm text-slate-600">
      Create your first reservation to see it listed here.
    </p>
    <Link
      to="/reservations/new"
      className="mt-4 inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
    >
      New reservation
    </Link>
  </div>
);

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div
    role="alert"
    className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800"
  >
    <h2 className="text-base font-semibold">We couldn’t load reservations</h2>
    <p className="mt-1 text-sm">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 inline-flex items-center rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-700"
    >
      Retry
    </button>
  </div>
);
