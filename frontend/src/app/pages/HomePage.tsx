import { motion } from "motion/react";
import { Link } from "react-router-dom";

import { useReservations } from "../../features/reservations";
import { useSpaces } from "../../features/spaces";
import {
  ActivityIcon,
  ArrowRightIcon,
  BarChartIcon,
  BuildingIcon,
  CalendarIcon,
  Card,
  ShieldIcon,
  ThermometerIcon,
  UsersIcon,
  ZapIcon,
  buttonClasses
} from "../../shared/ui";

const quickActions = [
  {
    to: "/spaces",
    title: "Browse spaces",
    description:
      "Explore every bookable workspace with capacity, location and IoT mapping.",
    icon: <BuildingIcon size={22} />,
    accent: "from-brand-500/10 via-brand-100/60 to-transparent",
    line: "border-brand-200/80"
  },
  {
    to: "/reservations",
    title: "Manage reservations",
    description:
      "Create, view and cancel bookings across every configured workspace.",
    icon: <CalendarIcon size={22} />,
    accent: "from-emerald-500/10 via-emerald-100/60 to-transparent",
    line: "border-emerald-200/80"
  },
  {
    to: "/admin",
    title: "Admin dashboard",
    description:
      "Monitor live telemetry, device state and operational alerts in one view.",
    icon: <ShieldIcon size={22} />,
    accent: "from-orange-500/10 via-orange-100/60 to-transparent",
    line: "border-orange-200/80"
  }
];

export const HomePage = () => {
  const spacesQuery = useSpaces();
  const reservationsQuery = useReservations({ pageSize: 3 });

  const spaces = spacesQuery.data ?? [];
  const totalCapacity = spaces.reduce((sum, space) => sum + space.capacity, 0);
  const reservations = reservationsQuery.data?.data ?? [];
  const totalReservations = reservationsQuery.data?.pagination.total ?? 0;
  const averageCapacity =
    spaces.length > 0 ? Math.round(totalCapacity / spaces.length) : 0;

  return (
    <div className="space-y-14 lg:space-y-16">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 px-5 py-8 shadow-[0_24px_90px_-62px_rgba(79,70,229,0.65)] backdrop-blur-xl sm:px-8 sm:py-12 lg:px-12"
      >
        <div
          aria-hidden="true"
          className="dot-field pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-70 lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-28 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-sky-100/70 blur-3xl"
        />

        <div className="relative grid gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] xl:items-center">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live · IoT enabled
            </span>

            <div className="space-y-5">
              <h1 className="text-5xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-6xl xl:text-7xl">
                Smart workspace reservations with live IoT visibility
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Reserve offices and desks, monitor real-time occupancy and
                environmental data, and keep every site in sync from a calm
                operations console.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                to="/reservations/new"
                className={buttonClasses("primary", "md", "sm:w-auto")}
              >
                Create reservation
                <ArrowRightIcon size={17} />
              </Link>
              <Link to="/spaces" className={buttonClasses("secondary", "md")}>
                <BuildingIcon size={17} />
                Browse spaces
              </Link>
            </div>
          </div>

          <HeroDashboard
            isLoading={spacesQuery.isLoading || reservationsQuery.isLoading}
            spacesCount={spaces.length}
            totalCapacity={totalCapacity}
            averageCapacity={averageCapacity}
            totalReservations={totalReservations}
            reservations={reservations}
          />
        </div>
      </motion.section>

      <section className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-600">
            Quick access
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            What would you like to do?
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.05 * index,
                ease: "easeOut"
              }}
            >
              <Link to={action.to} className="group block h-full">
                <Card
                  interactive
                  className={`relative h-full overflow-hidden border ${action.line}`}
                >
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 bg-gradient-to-br ${action.accent}`}
                  />
                  <div className="relative flex min-h-52 flex-col justify-between gap-8 p-7">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
                        {action.icon}
                      </span>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                          {action.title}
                        </h3>
                        <p className="text-sm leading-6 text-slate-600">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-700">
                      Open
                      <ArrowRightIcon
                        size={15}
                        className="transition group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

type HeroDashboardProps = {
  isLoading: boolean;
  spacesCount: number;
  totalCapacity: number;
  averageCapacity: number;
  totalReservations: number;
  reservations: Array<{
    id: string;
    customerEmail: string;
    startsAt: string;
    status: string;
  }>;
};

const HeroDashboard = ({
  isLoading,
  spacesCount,
  totalCapacity,
  averageCapacity,
  totalReservations,
  reservations
}: HeroDashboardProps) => (
  <div className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
    <div className="space-y-5">
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-950">
            Live overview
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
        <div className="grid divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <MetricTile
            icon={<ActivityIcon size={18} />}
            label="Workspaces"
            value={isLoading ? "—" : String(spacesCount)}
            hint={`${totalCapacity} total seats`}
          />
          <MetricTile
            icon={<UsersIcon size={18} />}
            label="Avg capacity"
            value={isLoading ? "—" : String(averageCapacity)}
            hint="Seats per workspace"
          />
        </div>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <MiniMetricCard
          icon={<ThermometerIcon size={18} />}
          label="Environment"
          value="IoT ready"
          hint="Telemetry pipeline active"
          lineColor="#4f46e5"
        />
        <MiniMetricCard
          icon={<ZapIcon size={18} />}
          label="Bookings"
          value={isLoading ? "—" : String(totalReservations)}
          hint="Across all spaces"
          lineColor="#0ea5e9"
        />
      </div>
    </div>

    <Card className="self-center p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <CalendarIcon size={18} />
        </span>
        <h2 className="text-sm font-semibold text-slate-950">
          Upcoming reservations
        </h2>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-sm text-slate-500">
          No reservations yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {reservations.map((reservation) => (
            <li
              key={reservation.id}
              className="rounded-2xl border border-slate-200/80 bg-white/80 p-4"
            >
              <p className="text-xs font-medium text-slate-500">
                {formatReservationDate(reservation.startsAt)}
              </p>
              <p className="mt-2 truncate text-sm font-semibold text-slate-950">
                {reservation.customerEmail}
              </p>
              <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {reservation.status}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/reservations"
        className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700"
      >
        View all reservations
        <ArrowRightIcon size={15} />
      </Link>
    </Card>
  </div>
);

const MetricTile = ({
  icon,
  label,
  value,
  hint
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) => (
  <div className="space-y-3 p-5">
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
      <span className="text-brand-500">{icon}</span>
      {label}
    </div>
    <p className="text-4xl font-semibold tracking-tight text-slate-950">
      {value}
    </p>
    <p className="text-xs text-slate-500">{hint}</p>
  </div>
);

const MiniMetricCard = ({
  icon,
  label,
  value,
  hint,
  lineColor
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  lineColor: string;
}) => (
  <Card className="p-5">
    <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
      <span className="text-brand-500">{icon}</span>
      {label}
    </div>
    <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
      {value}
    </p>
    <p className="mt-1 text-xs text-slate-500">{hint}</p>
    <MiniSparkline color={lineColor} />
  </Card>
);

const MiniSparkline = ({ color }: { color: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 180 44"
    className="mt-5 h-10 w-full"
    preserveAspectRatio="none"
  >
    <path
      d="M0 30 C18 14 34 14 52 28 C70 42 86 42 104 25 C122 8 140 12 158 24 C168 31 174 31 180 24"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const formatReservationDate = (iso: string): string =>
  new Date(iso).toLocaleString([], {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
