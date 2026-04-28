import { motion } from "motion/react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { normalizeApiError } from "../../../shared/api/errors";
import {
  ArrowRightIcon,
  Badge,
  BuildingIcon,
  CalendarIcon,
  Card,
  ChevronLeftIcon,
  ClockIcon,
  CpuIcon,
  ErrorState,
  MapPinIcon,
  Skeleton,
  UsersIcon,
  buttonClasses,
  cn
} from "../../../shared/ui";
import { usePlace } from "../../places";
import { formatDateTimeRange, todayDateInputValue } from "../../reservations/utils/date-format";
import { useSpace, useSpaceAvailability } from "../hooks/use-spaces";
import type { SpaceAvailability } from "../schemas/space";

export const SpaceDetailView = () => {
  const { space_id: spaceId } = useParams<{ space_id: string }>();
  const [selectedDate, setSelectedDate] = useState(todayDateInputValue);
  const spaceQuery = useSpace(spaceId);
  const placeQuery = usePlace(spaceQuery.data?.placeId);
  const availabilityQuery = useSpaceAvailability(spaceQuery.data?.id, selectedDate);

  return (
    <section className="space-y-8">
      <Link
        to="/spaces"
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-1 text-sm font-semibold text-slate-500 transition hover:text-brand-700"
      >
        <ChevronLeftIcon size={16} />
        Back to spaces
      </Link>

      {spaceQuery.isLoading ? (
        <Skeleton className="h-80" aria-busy="true" aria-label="Loading space" />
      ) : spaceQuery.isError ? (
        <ErrorState
          title="Space not available"
          message={normalizeApiError(spaceQuery.error).message}
        />
      ) : spaceQuery.data ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
        >
          <div className="space-y-6">
            <Card className="relative overflow-hidden">
              <div
                aria-hidden="true"
                className="dot-field pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-60 lg:block"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-100/80 blur-3xl"
              />
              <div className="relative space-y-8 p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-5">
                    <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
                      <BuildingIcon size={30} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
                        {placeQuery.data?.name ?? "Place pending..."}
                      </p>
                      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                        {spaceQuery.data.name}
                      </h1>
                      <Badge tone="brand" className="mt-4">
                        <UsersIcon size={12} />
                        Capacity {spaceQuery.data.capacity}
                      </Badge>
                    </div>
                  </div>
                </div>

                <dl className="grid gap-4 border-t border-slate-200/80 pt-6 sm:grid-cols-2 xl:grid-cols-4">
                  <HeroField
                    icon={<MapPinIcon size={17} />}
                    label="Location"
                    value={spaceQuery.data.locationReference ?? "-"}
                  />
                  <HeroField
                    icon={<ClockIcon size={17} />}
                    label="Timezone"
                    value={placeQuery.data?.timezone ?? "-"}
                  />
                  <HeroField
                    icon={<CpuIcon size={17} />}
                    label="IoT office ID"
                    value={spaceQuery.data.iotOfficeId}
                    code
                  />
                  <HeroField
                    icon={<CalendarIcon size={17} />}
                    label="Created"
                    value={new Date(spaceQuery.data.createdAt).toLocaleString()}
                  />
                </dl>
              </div>
            </Card>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Space details
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <DetailCard
                  icon={<MapPinIcon size={21} />}
                  label="Location reference"
                  value={spaceQuery.data.locationReference ?? "-"}
                  hint="Where people will find this workspace."
                />
                <DetailCard
                  icon={<ClockIcon size={21} />}
                  label="Timezone"
                  value={placeQuery.data?.timezone ?? "-"}
                  hint="All reservation times are interpreted in this timezone."
                />
                <DetailCard
                  icon={<CpuIcon size={21} />}
                  label="IoT office ID"
                  value={spaceQuery.data.iotOfficeId}
                  hint="Unique identifier used for telemetry and device state."
                  code
                />
                <DetailCard
                  icon={<CalendarIcon size={21} />}
                  label="Created"
                  value={new Date(spaceQuery.data.createdAt).toLocaleString()}
                  hint="The date this workspace was configured."
                />
              </div>
              <Card className="p-6">
                <p className="text-sm font-semibold text-slate-950">Description</p>
                <p className="mt-2 leading-7 text-slate-600">
                  {spaceQuery.data.description ?? "No description provided."}
                </p>
              </Card>
            </section>

            <AvailabilityCalendar
              availability={availabilityQuery.data}
              isLoading={availabilityQuery.isLoading}
              isError={availabilityQuery.isError}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>

          <aside className="space-y-5">
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <CalendarIcon size={20} />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Reservation ready
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Create a booking for this space from the reservation flow.
                  </p>
                </div>
              </div>
              <Link
                to="/reservations/new"
                className={buttonClasses("primary", "md", "mt-6 w-full")}
              >
                Create reservation
                <ArrowRightIcon size={16} />
              </Link>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold text-slate-950">Quick stats</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <SidebarStat label="Capacity" value={String(spaceQuery.data.capacity)} />
                <SidebarStat
                  label="Place"
                  value={placeQuery.data?.name ?? "Pending"}
                />
                <SidebarStat
                  label="IoT office"
                  value={spaceQuery.data.iotOfficeId}
                />
              </dl>
            </Card>
          </aside>
        </motion.div>
      ) : null}
    </section>
  );
};

const HeroField = ({
  icon,
  label,
  value,
  code = false
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  code?: boolean;
}) => (
  <div className="flex gap-3">
    <dt className="mt-0.5 text-brand-600">{icon}</dt>
    <dd className="min-w-0">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {code ? (
        <code className="mt-1 inline-flex rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-800">
          {value}
        </code>
      ) : (
        <p className="mt-1 truncate text-sm font-semibold text-slate-950">
          {value}
        </p>
      )}
    </dd>
  </div>
);

const DetailCard = ({
  icon,
  label,
  value,
  hint,
  code = false
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  code?: boolean;
}) => (
  <Card className="p-6">
    <div className="flex gap-4">
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        {code ? (
          <code className="mt-1 inline-flex rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-800">
            {value}
          </code>
        ) : (
          <p className="mt-1 text-slate-800">{value}</p>
        )}
        <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>
      </div>
    </div>
  </Card>
);

const SidebarStat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-slate-500">{label}</dt>
    <dd className="truncate text-right font-semibold text-slate-950">{value}</dd>
  </div>
);

const AvailabilityCalendar = ({
  availability,
  isLoading,
  isError,
  selectedDate,
  onDateChange
}: {
  availability?: SpaceAvailability;
  isLoading: boolean;
  isError: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
}) => (
  <section className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Daily availability
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Availability is calculated from office hours and active reservations.
        </p>
      </div>
      <label className="text-sm font-semibold text-slate-700">
        Date
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => onDateChange(event.target.value)}
          className="mt-1 block min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </label>
    </div>

    <Card className="p-5">
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : isError ? (
        <ErrorState
          title="Availability unavailable"
          message="We couldn't load this space's daily availability."
        />
      ) : availability ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">
              Available
            </span>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700 ring-1 ring-rose-100">
              Reserved
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <WindowList
              title="Available"
              tone="available"
              empty="No available windows remain for this day."
              windows={availability.availableWindows}
            />
            <WindowList
              title="Reserved"
              tone="reserved"
              empty="No reserved windows on this day."
              windows={availability.reservedWindows}
            />
          </div>
        </div>
      ) : null}
    </Card>
  </section>
);

const WindowList = ({
  title,
  tone,
  empty,
  windows
}: {
  title: string;
  tone: "available" | "reserved";
  empty: string;
  windows: Array<{ startsAt: string; endsAt: string }>;
}) => (
  <div>
    <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
    {windows.length === 0 ? (
      <p className="mt-2 text-sm text-slate-500">{empty}</p>
    ) : (
      <ul className="mt-3 space-y-2">
        {windows.map((window) => (
          <li
            key={`${window.startsAt}-${window.endsAt}`}
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-semibold",
              tone === "available"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            )}
          >
            {formatDateTimeRange(window.startsAt, window.endsAt)}
          </li>
        ))}
      </ul>
    )}
  </div>
);
