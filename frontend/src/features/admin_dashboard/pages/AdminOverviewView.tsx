import { motion } from "motion/react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

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
  ZapIcon
} from "../../../shared/ui";
import { useReservations } from "../../reservations";
import { usePlaces, type Place } from "../../places";
import { useSpaces } from "../../spaces";
import { StatCard } from "../components/StatCard";

export const AdminOverviewView = () => {
  const spacesQuery = useSpaces();
  const placesQuery = usePlaces();
  const reservationsQuery = useReservations({ pageSize: 1 });

  const placesById = useMemo(() => {
    const map = new Map<string, Place>();
    for (const place of placesQuery.data ?? []) {
      map.set(place.id, place);
    }
    return map;
  }, [placesQuery.data]);

  const spaces = spacesQuery.data ?? [];
  const totalCapacity = spaces.reduce((sum, s) => sum + s.capacity, 0);
  const totalReservations = reservationsQuery.data?.pagination.total ?? 0;

  return (
    <section className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total spaces"
          value={spacesQuery.isLoading ? "—" : String(spaces.length)}
          hint="Configured workspaces"
          icon={<BuildingIcon size={16} />}
          tone="brand"
        />
        <StatCard
          label="Total capacity"
          value={spacesQuery.isLoading ? "—" : String(totalCapacity)}
          hint={`Across ${spaces.length} space${spaces.length !== 1 ? "s" : ""}`}
          icon={<UsersIcon size={16} />}
          tone="neutral"
        />
        <StatCard
          label="Live telemetry"
          value={spacesQuery.isLoading ? "—" : String(spaces.length)}
          hint="All systems operational"
          icon={<ZapIcon size={16} />}
          tone="brand"
        />
        <StatCard
          label="Total reservations"
          value={reservationsQuery.isLoading ? "—" : String(totalReservations)}
          hint={
            <Link to="/reservations" className="inline-flex items-center gap-0.5 text-brand-700 hover:underline">
              View reservations <ArrowRightIcon size={10} />
            </Link>
          }
          icon={<CalendarIcon size={16} />}
          tone="neutral"
        />
      </div>

      <PageHeader
        eyebrow="Operations"
        title="Admin dashboard"
        description="Pick a space to see its live telemetry, alerts and device controls."
      />

      {spacesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44" />
          ))}
        </div>
      ) : spacesQuery.isError ? (
        <ErrorState
          title="We couldn’t load spaces"
          message={normalizeApiError(spacesQuery.error).message}
          onRetry={() => spacesQuery.refetch()}
        />
      ) : (spacesQuery.data ?? []).length === 0 ? (
        <EmptyState
          icon={<ActivityIcon size={20} />}
          title="No spaces to monitor"
          description="Create a space first, then come back to wire up telemetry and alerts."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <Card interactive className="h-full">
                    <div className="flex h-full flex-col gap-4 p-6">
                      <header className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                            <BuildingIcon size={18} />
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-slate-900">
                              {space.name}
                            </h3>
                            <p className="truncate text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                              {place?.name ?? "Unknown place"}
                            </p>
                          </div>
                        </div>
                        <Badge tone="brand">
                          <UsersIcon size={12} />
                          Capacity {space.capacity}
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

                      <footer className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CpuIcon size={12} className="text-slate-400" />
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                            {space.iotOfficeId}
                          </code>
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-brand-700">
                          Open dashboard
                          <ArrowRightIcon
                            size={14}
                            className="transition group-hover:translate-x-0.5"
                          />
                        </span>
                      </footer>
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
