import { useDeferredValue, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { normalizeApiError } from "../../../shared/api/errors";
import {
  Button,
  buttonClasses,
  Card,
  CalendarIcon,
  ChevronDownIcon,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  Skeleton,
  TrashIcon
} from "../../../shared/ui";
import { useSpaces, type Space } from "../../spaces";
import { ReservationStatusBadge } from "../components/ReservationStatusBadge";
import {
  useCancelReservation,
  useDeleteReservation,
  useReservations
} from "../hooks/use-reservations";
import type { Reservation } from "../schemas/reservation";
import { formatDateTimeRange } from "../utils/date-format";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["all", "ACTIVE", "CANCELLED", "EXPIRED"] as const;

export const ReservationsListView = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [spaceFilter, setSpaceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [pendingCancel, setPendingCancel] = useState<Reservation | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Reservation | null>(null);
  const reservationsQuery = useReservations({ page, pageSize: PAGE_SIZE });
  const spacesQuery = useSpaces();
  const cancelMutation = useCancelReservation();
  const deleteMutation = useDeleteReservation();
  const deferredSearch = useDeferredValue(search);

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
        setPendingCancel(null);
        toast.success("Reservation cancelled.");
      },
      onError: (error) => toast.error(normalizeApiError(error).message)
    });
  };

  const handleDelete = (reservation: Reservation) => {
    deleteMutation.mutate(reservation.id, {
      onSuccess: () => {
        setPendingDelete(null);
        toast.success("Reservation deleted.");
      },
      onError: (error) => toast.error(normalizeApiError(error).message)
    });
  };

  const total = reservationsQuery.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const reservations = reservationsQuery.data?.data ?? [];
  const filteredReservations = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return reservations.filter((reservation) => {
      const space = spacesById.get(reservation.spaceId);
      if (spaceFilter !== "all" && reservation.spaceId !== spaceFilter) return false;
      if (statusFilter !== "all" && reservation.status !== statusFilter) return false;
      if (!q) return true;
      return (
        reservation.customerEmail.toLowerCase().includes(q) ||
        (space?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [deferredSearch, reservations, spaceFilter, spacesById, statusFilter]);

  const hasActiveFilters =
    search.trim() !== "" || spaceFilter !== "all" || statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setSpaceFilter("all");
    setStatusFilter("all");
  };

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Bookings"
        title="Reservations"
        description="View and manage all workspace reservations across your organization."
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

      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto_auto_auto]">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
              <SearchIcon size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by customer or space..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-800 shadow-sm shadow-slate-900/[0.02] placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <FilterSelect
            label="Space"
            value={spaceFilter}
            onChange={setSpaceFilter}
          >
            <option value="all">All spaces</option>
            {(spacesQuery.data ?? []).map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as (typeof STATUS_OPTIONS)[number])
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </option>
            ))}
          </FilterSelect>

          <Button
            variant={hasActiveFilters ? "secondary" : "ghost"}
            size="md"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
          >
            <RefreshIcon size={15} />
            Reset
          </Button>
        </div>
      </Card>

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
      ) : filteredReservations.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={20} />}
          title="No reservations match your filters"
          description="Try changing the search, space, or status filter."
          action={
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] divide-y divide-slate-200/80 text-sm lg:min-w-full">
              <thead className="bg-slate-50/70 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Space
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Window
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="cursor-pointer transition hover:bg-slate-50/70 focus-within:bg-slate-50/70"
                    onClick={() => navigate(`/reservations/${reservation.id}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold uppercase text-brand-700 ring-1 ring-brand-100">
                          {reservation.customerEmail.charAt(0)}
                        </span>
                        <div>
                          <Link
                            to={`/reservations/${reservation.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="font-semibold text-slate-950 transition hover:text-brand-700"
                          >
                            {reservation.customerEmail}
                          </Link>
                          <p className="text-xs text-slate-500">Customer</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-700">
                      <span className="font-semibold text-slate-950">
                        {spacesById.get(reservation.spaceId)?.name ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-600">
                      {formatDateTimeRange(reservation.startsAt, reservation.endsAt)}
                    </td>
                    <td className="px-6 py-5">
                      <ReservationStatusBadge status={reservation.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div
                        className="flex justify-end gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {reservation.status === "ACTIVE" ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setPendingCancel(reservation)}
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
                        {reservation.status === "CANCELLED" ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setPendingDelete(reservation)}
                            disabled={
                              deleteMutation.isPending &&
                              deleteMutation.variables === reservation.id
                            }
                          >
                            <TrashIcon size={14} />
                            {deleteMutation.isPending &&
                            deleteMutation.variables === reservation.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        ) : null}
                      </div>
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
          className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/75 p-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between"
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

      <Modal
        isOpen={pendingCancel !== null}
        title="Cancel reservation"
        description="This will mark the reservation as cancelled. You can delete it after cancellation if you no longer need the record."
        onClose={() => setPendingCancel(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPendingCancel(null)}>
              Keep reservation
            </Button>
            <Button
              variant="danger"
              onClick={() => pendingCancel && handleCancel(pendingCancel)}
              disabled={cancelMutation.isPending}
            >
              Confirm cancel
            </Button>
          </>
        }
      />

      <Modal
        isOpen={pendingDelete !== null}
        title="Delete reservation"
        description="This permanently removes the cancelled reservation from the system."
        onClose={() => setPendingDelete(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Keep record
            </Button>
            <Button
              variant="danger"
              onClick={() => pendingDelete && handleDelete(pendingDelete)}
              disabled={deleteMutation.isPending}
            >
              Confirm delete
            </Button>
          </>
        }
      />
    </section>
  );
};

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
};

const FilterSelect = ({
  label,
  value,
  onChange,
  children
}: FilterSelectProps) => (
  <label className="relative min-w-0 lg:min-w-52">
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-800 shadow-sm shadow-slate-900/[0.02] focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
    >
      {children}
    </select>
    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
      <ChevronDownIcon size={16} />
    </span>
  </label>
);
