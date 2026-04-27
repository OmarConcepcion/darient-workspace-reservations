import { motion } from "motion/react";
import { Link } from "react-router-dom";

import {
  ActivityIcon,
  ArrowRightIcon,
  BuildingIcon,
  CalendarIcon,
  Card,
  UsersIcon,
  ZapIcon,
  buttonClasses
} from "../../shared/ui";
import { useReservations } from "../../features/reservations";
import { useSpaces } from "../../features/spaces";

const features = [
  {
    to: "/spaces",
    label: "Spaces",
    title: "Browse workspaces",
    description:
      "Inspect every bookable space across configured places, with capacity and IoT mapping at a glance.",
    icon: <BuildingIcon size={20} />,
    accent: "from-indigo-500/10 via-indigo-500/5 to-transparent"
  },
  {
    to: "/reservations",
    label: "Reservations",
    title: "Plan and manage bookings",
    description:
      "Create new reservations, review the schedule and cancel active bookings in one place.",
    icon: <CalendarIcon size={20} />,
    accent: "from-violet-500/10 via-violet-500/5 to-transparent"
  },
  {
    to: "/admin",
    label: "Admin",
    title: "Live telemetry & alerts",
    description:
      "Monitor occupancy, CO₂ and device state in real time, and tune sampling without leaving the app.",
    icon: <ActivityIcon size={20} />,
    accent: "from-fuchsia-500/10 via-fuchsia-500/5 to-transparent"
  }
];

const SystemOverviewPanel = () => {
  const spacesQuery = useSpaces();
  const reservationsQuery = useReservations({ pageSize: 3 });

  const spaces = spacesQuery.data ?? [];
  const totalCapacity = spaces.reduce((sum, s) => sum + s.capacity, 0);
  const totalReservations = reservationsQuery.data?.pagination.total ?? 0;
  const recentReservations = reservationsQuery.data?.data ?? [];

  return (
    <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm shadow-slate-900/[0.04] backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            System overview
          </p>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          <StatItem
            icon={<BuildingIcon size={14} />}
            label="Spaces"
            value={spacesQuery.isLoading ? "—" : String(spaces.length)}
          />
          <StatItem
            icon={<UsersIcon size={14} />}
            label="Seats"
            value={spacesQuery.isLoading ? "—" : String(totalCapacity)}
          />
          <StatItem
            icon={<ZapIcon size={14} />}
            label="Bookings"
            value={reservationsQuery.isLoading ? "—" : String(totalReservations)}
          />
        </div>

        <div className="px-4 py-3">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Recent reservations
          </p>
          {reservationsQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : recentReservations.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No reservations yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {recentReservations.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-700">
                      {r.customerEmail}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(r.startsAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700"
                        : r.status === "CANCELLED"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 px-4 py-2.5">
          <Link
            to="/reservations"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800 transition"
          >
            View all reservations
            <ArrowRightIcon size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex flex-col items-center gap-1 px-2 py-3">
    <span className="text-slate-400">{icon}</span>
    <p className="text-lg font-semibold tracking-tight text-slate-900">{value}</p>
    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
      {label}
    </p>
  </div>
);

export const HomePage = () => (
  <div className="space-y-12">
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-brand-50/60 px-8 py-12 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-brand-300/30 to-fuchsia-300/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-brand-200/40 to-sky-200/30 blur-3xl"
      />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="max-w-xl flex-1 space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 ring-1 ring-brand-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live · IoT enabled
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Smart workspace reservations with live IoT visibility
          </h1>
          <p className="text-base leading-relaxed text-slate-600">
            Reserve offices and desks, monitor real-time occupancy and
            environmental data, and keep every site in sync.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/reservations/new"
              className={buttonClasses("primary", "md")}
            >
              Create reservation
              <ArrowRightIcon size={16} />
            </Link>
            <Link to="/spaces" className={buttonClasses("secondary", "md")}>
              Browse spaces
            </Link>
          </div>
        </div>

        <SystemOverviewPanel />
      </div>
    </motion.section>

    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Quick access
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            What would you like to do?
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.05 * index,
              ease: "easeOut"
            }}
          >
            <Link to={feature.to} className="group block h-full">
              <Card interactive className="relative h-full overflow-hidden">
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 transition group-hover:opacity-100`}
                />
                <div className="relative flex h-full flex-col gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                      {feature.icon}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 group-hover:text-brand-600">
                      {feature.label}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                  <div className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
                    Open
                    <ArrowRightIcon
                      size={14}
                      className="transition group-hover:translate-x-0.5"
                    />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  </div>
);
