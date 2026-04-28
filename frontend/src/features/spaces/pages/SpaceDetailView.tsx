import { motion } from "motion/react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { formatUiDateTime, uiTerms } from "../../../shared/i18n";
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
        Volver a oficinas
      </Link>

      {spaceQuery.isLoading ? (
        <Skeleton
          className="h-80"
          aria-busy="true"
          aria-label={uiTerms.a11y.loadingSpace}
        />
      ) : spaceQuery.isError ? (
        <ErrorState
          title="Oficina no disponible"
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
                        {placeQuery.data?.name ?? "Lugar pendiente..."}
                      </p>
                      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                        {spaceQuery.data.name}
                      </h1>
                      <Badge tone="brand" className="mt-4">
                        <UsersIcon size={12} />
                        Capacidad {spaceQuery.data.capacity}
                      </Badge>
                    </div>
                  </div>
                </div>

                <dl className="grid gap-4 border-t border-slate-200/80 pt-6 sm:grid-cols-2 xl:grid-cols-4">
                  <HeroField
                    icon={<MapPinIcon size={17} />}
                    label="Ubicación"
                    value={spaceQuery.data.locationReference ?? "-"}
                  />
                  <HeroField
                    icon={<ClockIcon size={17} />}
                    label="Zona horaria"
                    value={placeQuery.data?.timezone ?? "-"}
                  />
                  <HeroField
                    icon={<CpuIcon size={17} />}
                    label="ID IoT de oficina"
                    value={spaceQuery.data.iotOfficeId}
                    code
                  />
                  <HeroField
                    icon={<CalendarIcon size={17} />}
                    label="Creada"
                    value={formatUiDateTime(spaceQuery.data.createdAt, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  />
                </dl>
              </div>
            </Card>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Detalles de la oficina
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <DetailCard
                  icon={<MapPinIcon size={21} />}
                  label="Referencia de ubicación"
                  value={spaceQuery.data.locationReference ?? "-"}
                  hint="Cómo las personas encontrarán esta oficina."
                />
                <DetailCard
                  icon={<ClockIcon size={21} />}
                  label="Zona horaria"
                  value={placeQuery.data?.timezone ?? "-"}
                  hint="Todas las reservas se interpretan en esta zona horaria."
                />
                <DetailCard
                  icon={<CpuIcon size={21} />}
                  label="ID IoT de oficina"
                  value={spaceQuery.data.iotOfficeId}
                  hint="Identificador único usado para telemetría y estado del dispositivo."
                  code
                />
                <DetailCard
                  icon={<CalendarIcon size={21} />}
                  label="Creada"
                  value={formatUiDateTime(spaceQuery.data.createdAt, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                  hint="Fecha en que se configuró esta oficina."
                />
              </div>
              <Card className="p-6">
                <p className="text-sm font-semibold text-slate-950">Descripción</p>
                <p className="mt-2 leading-7 text-slate-600">
                  {spaceQuery.data.description ?? "No se proporcionó descripción."}
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
                    Lista para reservar
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Crea una reserva para esta oficina desde el flujo de reservas.
                  </p>
                </div>
              </div>
              <Link
                to="/reservations/new"
                className={buttonClasses("primary", "md", "mt-6 w-full")}
              >
                {uiTerms.actions.createReservation}
                <ArrowRightIcon size={16} />
              </Link>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold text-slate-950">Resumen rápido</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <SidebarStat label="Capacidad" value={String(spaceQuery.data.capacity)} />
                <SidebarStat
                  label="Lugar"
                  value={placeQuery.data?.name ?? "Pendiente"}
                />
                <SidebarStat
                  label="Oficina IoT"
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
          Disponibilidad diaria
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          La disponibilidad se calcula con horario de oficina y reservas activas.
        </p>
      </div>
      <label className="text-sm font-semibold text-slate-700">
        Fecha
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => onDateChange(event.target.value)}
          onClick={openNativePicker}
          className="mt-1 block min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </label>
    </div>

    <Card className="p-5">
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : isError ? (
        <ErrorState
          title="Disponibilidad no disponible"
          message="No pudimos cargar la disponibilidad diaria de esta oficina."
        />
      ) : availability ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">
              Disponible
            </span>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700 ring-1 ring-rose-100">
              Reservado
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <WindowList
              title="Disponible"
              tone="available"
              empty="No quedan ventanas disponibles para este día."
              windows={availability.availableWindows}
            />
            <WindowList
              title="Reservado"
              tone="reserved"
              empty="No hay ventanas reservadas para este día."
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

const openNativePicker = (event: React.MouseEvent<HTMLInputElement>): void => {
  if (typeof event.currentTarget.showPicker !== "function") {
    return;
  }

  try {
    event.currentTarget.showPicker();
  } catch {
    // Ignore unsupported or already-open picker calls.
  }
};
