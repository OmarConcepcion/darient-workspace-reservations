import { cn } from "../../../shared/ui";
import {
  formatDateInputLabel,
  formatIsoTime,
  formatTimeRange
} from "../utils/date-format";

type TimeWindow = {
  startsAt: string;
  endsAt: string;
};

type ReservationTimeRangeTimelineProps = {
  reservationDate: string;
  startTime: string;
  endTime: string;
  availableWindows: TimeWindow[];
  reservedWindows: TimeWindow[];
  isLoading: boolean;
  isReady: boolean;
  isError: boolean;
};

const MINUTES_PER_DAY = 24 * 60;
const HOUR_MARKERS = ["00:00", "06:00", "12:00", "18:00", "24:00"];

export const ReservationTimeRangeTimeline = ({
  reservationDate,
  startTime,
  endTime,
  availableWindows,
  reservedWindows,
  isLoading,
  isReady,
  isError
}: ReservationTimeRangeTimelineProps) => {
  const selectedRange =
    startTime && endTime
      ? {
          startsAt: startTime,
          endsAt: endTime
        }
      : null;

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-slate-50/80 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">
            Availability reference
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            The day stays fixed while you choose the start and end hour for the
            reservation.
          </p>
        </div>
        {reservationDate ? (
          <p className="text-sm font-medium text-slate-700">
            {formatDateInputLabel(reservationDate)}
          </p>
        ) : null}
      </div>

      {!isReady ? (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
          Select a space and a reservation date to preview the day.
        </p>
      ) : isLoading ? (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
          Loading daily availability...
        </p>
      ) : isError ? (
        <p className="mt-5 rounded-2xl border border-dashed border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
          We couldn&apos;t load the availability reference for this day.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <TimelineTrack
            label="Selected range"
            tone="selected"
            windows={selectedRange ? [selectedRange] : []}
            empty="Choose a start and end time to highlight your request."
            inputMode
          />
          <TimelineTrack
            label="Available"
            tone="available"
            windows={availableWindows}
            empty="No available windows reported for this day."
          />
          <TimelineTrack
            label="Reserved"
            tone="reserved"
            windows={reservedWindows}
            empty="No reserved windows reported for this day."
          />
          <div className="grid grid-cols-5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            {HOUR_MARKERS.map((marker) => (
              <span
                key={marker}
                className={cn(marker === "24:00" ? "text-right" : "text-left")}
              >
                {marker}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Availability is shown as reference only in this first version. The
            backend still validates conflicts when you submit.
          </p>
        </div>
      )}
    </div>
  );
};

const TimelineTrack = ({
  label,
  tone,
  windows,
  empty,
  inputMode = false
}: {
  label: string;
  tone: "selected" | "available" | "reserved";
  windows: TimeWindow[];
  empty: string;
  inputMode?: boolean;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xs text-slate-500">
        {windows.length > 0
          ? windows.map((window) => formatWindowLabel(window, inputMode)).join(", ")
          : empty}
      </p>
    </div>
    <div className="relative h-12 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px)",
          backgroundSize: `${100 / 24}% 100%`
        }}
      />
      {windows.map((window) => {
        const segment = buildSegment(window, inputMode);
        if (!segment) return null;

        return (
          <div
            key={`${label}-${window.startsAt}-${window.endsAt}`}
            className={cn(
              "absolute inset-y-1 rounded-xl",
              tone === "selected" && "bg-brand-500/80 shadow-sm shadow-brand-500/20",
              tone === "available" && "bg-emerald-400/70",
              tone === "reserved" && "bg-rose-400/75"
            )}
            style={{
              left: `${segment.left}%`,
              width: `${segment.width}%`
            }}
          />
        );
      })}
    </div>
  </div>
);

const buildSegment = (
  window: TimeWindow,
  inputMode: boolean
): { left: number; width: number } | null => {
  const startsAt = inputMode
    ? parseInputTime(window.startsAt)
    : parseIsoTime(window.startsAt);
  const endsAt = inputMode
    ? parseInputTime(window.endsAt)
    : parseIsoTime(window.endsAt);

  if (startsAt === null || endsAt === null || endsAt <= startsAt) {
    return null;
  }

  const left = (startsAt / MINUTES_PER_DAY) * 100;
  const width = Math.max(((endsAt - startsAt) / MINUTES_PER_DAY) * 100, 0.8);
  return { left, width };
};

const parseInputTime = (value: string): number | null => {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const parseIsoTime = (value: string): number | null => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
};

const formatWindowLabel = (window: TimeWindow, inputMode: boolean): string =>
  inputMode
    ? formatTimeRange(window.startsAt, window.endsAt)
    : formatTimeRange(formatIsoTime(window.startsAt), formatIsoTime(window.endsAt));
