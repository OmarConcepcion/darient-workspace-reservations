import { useDeferredValue, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { normalizeApiError } from "../../../shared/api/errors";
import {
  reservationStatusLabels,
  uiTerms
} from "../../../shared/i18n";
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
        toast.success("Reserva cancelada.");
      },
      onError: (error) => toast.error(normalizeApiError(error).message)
    });
  };

  const handleDelete = (reservation: Reservation) => {
    deleteMutation.mutate(reservation.id, {
      onSuccess: () => {
        setPendingDelete(null);
        toast.success("Reserva eliminada.");
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
        eyebrow="Reservas"
        title="Reservas"
        description="Consulta y gestiona todas las reservas de oficinas en tu organización."
        actions={
          <Link
            to="/reservations/new"
            className={buttonClasses("primary", "md")}
          >
            <PlusIcon size={16} />
            {uiTerms.actions.newReservation}
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
              placeholder="Buscar por cliente u oficina..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-800 shadow-sm shadow-slate-900/[0.02] placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <FilterSelect
            label="Oficina"
            value={spaceFilter}
            onChange={setSpaceFilter}
          >
            <option value="all">Todas las oficinas</option>
            {(spacesQuery.data ?? []).map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Estado"
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as (typeof STATUS_OPTIONS)[number])
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "all"
                  ? "Todos los estados"
                  : reservationStatusLabels[status]}
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
            {uiTerms.actions.reset}
          </Button>
        </div>
      </Card>

      {reservationsQuery.isLoading ? (
        <Skeleton
          className="h-72"
          aria-busy="true"
          aria-label={uiTerms.a11y.loadingReservation}
        />
      ) : reservationsQuery.isError ? (
        <ErrorState
          title="No pudimos cargar las reservas"
          message={normalizeApiError(reservationsQuery.error).message}
          onRetry={() => reservationsQuery.refetch()}
        />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={20} />}
          title="No hay reservas todavía"
          description="Crea tu primera reserva para verla listada aquí."
          action={
            <Link
              to="/reservations/new"
              className={buttonClasses("primary", "md")}
            >
              <PlusIcon size={16} />
              {uiTerms.actions.newReservation}
            </Link>
          }
        />
      ) : filteredReservations.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={20} />}
          title="No hay reservas que coincidan con tus filtros"
          description="Prueba cambiando la búsqueda, la oficina o el estado."
          action={
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              {uiTerms.actions.reset}
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
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Oficina
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Rango
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Acción
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
                          <p className="text-xs text-slate-500">Cliente</p>
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
                            ? "Cancelando…"
                            : uiTerms.actions.cancel}
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
                              ? "Eliminando..."
                              : uiTerms.actions.delete}
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
          aria-label={uiTerms.a11y.reservationsPagination}
          className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/75 p-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <p>
            Página {page} de {totalPages} · {total} en total
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              {uiTerms.actions.previous}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page >= totalPages}
            >
              {uiTerms.actions.next}
            </Button>
          </div>
        </nav>
      ) : null}

      <Modal
        isOpen={pendingCancel !== null}
        title={uiTerms.actions.cancelReservation}
        description="Esto marcará la reserva como cancelada. Podrás eliminarla después si ya no necesitas el registro."
        onClose={() => setPendingCancel(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPendingCancel(null)}>
              {uiTerms.actions.keepReservation}
            </Button>
            <Button
              variant="danger"
              onClick={() => pendingCancel && handleCancel(pendingCancel)}
              disabled={cancelMutation.isPending}
            >
              {uiTerms.actions.confirmCancel}
            </Button>
          </>
        }
      />

      <Modal
        isOpen={pendingDelete !== null}
        title={uiTerms.actions.deleteReservation}
        description="Esto elimina permanentemente la reserva cancelada del sistema."
        onClose={() => setPendingDelete(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              {uiTerms.actions.keepRecord}
            </Button>
            <Button
              variant="danger"
              onClick={() => pendingDelete && handleDelete(pendingDelete)}
              disabled={deleteMutation.isPending}
            >
              {uiTerms.actions.confirmDelete}
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
