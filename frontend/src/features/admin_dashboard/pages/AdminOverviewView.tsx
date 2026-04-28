import { motion } from "motion/react";
import { Link } from "react-router-dom";

import { uiTerms } from "../../../shared/i18n";
import { normalizeApiError } from "../../../shared/api/errors";
import {
  ActivityIcon,
  ArrowRightIcon,
  Badge,
  BuildingIcon,
  CalendarIcon,
  Card,
  CpuIcon,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  UsersIcon,
  buttonClasses
} from "../../../shared/ui";
import { useReservations } from "../../reservations";
import { usePlaces, type Place } from "../../places";
import { useSpaces } from "../../spaces";

export const AdminOverviewView = () => {
  const spacesQuery = useSpaces();
  const placesQuery = usePlaces();
  const reservationsQuery = useReservations({ pageSize: 1 });

  const placesById = new Map<string, Place>();
  for (const place of placesQuery.data ?? []) {
    placesById.set(place.id, place);
  }

  const spaces = spacesQuery.data ?? [];
  const totalCapacity = spaces.reduce((sum, s) => sum + s.capacity, 0);
  const totalReservations = reservationsQuery.data?.pagination.total ?? 0;

  return (
    <section className="space-y-8">
      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-slate-200/80">
          <SummaryMetric
            label="Telemetría en vivo"
            value={spacesQuery.isLoading ? "—" : String(spaces.length)}
            hint="Oficinas en línea"
            icon={<ActivityIcon size={22} />}
            tone="brand"
          />
          <SummaryMetric
            label="Total de oficinas"
            value={spacesQuery.isLoading ? "—" : String(spaces.length)}
            hint="Oficinas configuradas"
            icon={<BuildingIcon size={22} />}
            tone="brand"
          />
          <SummaryMetric
            label="Capacidad total"
            value={spacesQuery.isLoading ? "—" : String(totalCapacity)}
            hint={`En ${spaces.length} ${spaces.length === 1 ? "oficina" : "oficinas"}`}
            icon={<UsersIcon size={22} />}
            tone="success"
          />
          <SummaryMetric
            label="Total de reservas"
            value={reservationsQuery.isLoading ? "—" : String(totalReservations)}
            hint={
              <Link
                to="/reservations"
                className="inline-flex items-center gap-1 text-brand-700 hover:underline"
              >
                Ver reservas <ArrowRightIcon size={11} />
              </Link>
            }
            icon={<CalendarIcon size={22} />}
            tone="warning"
          />
        </div>
      </Card>

      <PageHeader
        eyebrow="Operaciones"
        title="Dashboard admin"
        description="Elige una oficina para revisar telemetría en vivo, alertas y controles del dispositivo."
      />

      {spacesQuery.isLoading ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : spacesQuery.isError ? (
        <ErrorState
          title="No pudimos cargar las oficinas"
          message={normalizeApiError(spacesQuery.error).message}
          onRetry={() => spacesQuery.refetch()}
        />
      ) : (spacesQuery.data ?? []).length === 0 ? (
        <EmptyState
          icon={<ActivityIcon size={20} />}
          title="No hay oficinas para monitorear"
          description="Crea primero una oficina y luego vuelve para conectar telemetría y alertas."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {spacesQuery.data?.map((space, index) => {
            const place = placesById.get(space.placeId);
            return (
              <motion.div
                key={space.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: 0.04 * index,
                  ease: "easeOut"
                }}
              >
                <Link
                  to={`/admin/spaces/${space.id}`}
                  className="group block h-full"
                >
                  <Card interactive className="h-full overflow-hidden">
                    <div className="grid h-full gap-5 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_12rem]">
                      <div className="flex min-w-0 flex-col gap-5">
                        <header className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                            <BuildingIcon size={24} />
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-semibold tracking-tight text-slate-950">
                              {space.name}
                            </h3>
                            <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              {place?.name ?? "Lugar desconocido"}
                            </p>
                          </div>
                        </div>
                        <Badge tone="brand">
                          <UsersIcon size={12} />
                          Capacidad {space.capacity}
                        </Badge>
                        </header>

                        <div className="space-y-2 text-sm text-slate-600">
                        {space.locationReference ? (
                          <p>{space.locationReference}</p>
                        ) : null}
                        {space.description ? (
                          <p className="line-clamp-2 text-slate-500">
                            {space.description}
                          </p>
                        ) : null}
                        </div>

                        <footer className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <span className="inline-flex items-center gap-1.5">
                          <CpuIcon size={12} className="text-slate-400" />
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                            {space.iotOfficeId}
                          </code>
                        </span>
                        <span
                          className={buttonClasses(
                            "primary",
                            "sm",
                            "px-4"
                          )}
                        >
                          {uiTerms.actions.openDashboard}
                          <ArrowRightIcon
                            size={14}
                            className="transition group-hover:translate-x-0.5"
                          />
                        </span>
                        </footer>
                      </div>

                      <div className="relative hidden min-h-52 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-brand-50/70 lg:block">
                        <div className="absolute inset-x-6 bottom-6 h-20 rounded-2xl bg-white/80 shadow-sm" />
                        <div className="absolute bottom-14 left-11 h-16 w-10 rounded-t-2xl border border-slate-200 bg-white" />
                        <div className="absolute bottom-14 right-10 h-16 w-16 rounded-xl border border-slate-200 bg-white/90" />
                        <div className="absolute right-8 top-8 h-20 w-24 rounded-xl border border-slate-200 bg-white/70" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};

type SummaryMetricProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  tone: "brand" | "success" | "warning";
};

const summaryTone = {
  brand: "bg-brand-50 text-brand-600 ring-brand-100",
  success: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  warning: "bg-orange-50 text-orange-600 ring-orange-100"
};

const SummaryMetric = ({
  label,
  value,
  hint,
  icon,
  tone
}: SummaryMetricProps) => (
  <div className="flex gap-4 p-3 xl:px-7">
    <span
      className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl ring-1 ${summaryTone[tone]}`}
    >
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p> : null}
    </div>
  </div>
);
