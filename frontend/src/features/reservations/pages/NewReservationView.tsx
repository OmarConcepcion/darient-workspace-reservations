import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { normalizeApiError } from "../../../shared/api/errors";
import {
  AlertCircleIcon,
  Button,
  buttonClasses,
  Card,
  CalendarIcon,
  ChevronLeftIcon,
  cn,
  MailIcon,
  PageHeader
} from "../../../shared/ui";
import { usePlaces } from "../../places";
import { useSpaceAvailability, useSpaces } from "../../spaces";
import { ReservationTimeRangeTimeline } from "../components/ReservationTimeRangeTimeline";
import { useCreateReservation } from "../hooks/use-reservations";
import {
  newReservationFormSchema,
  type NewReservationFormValues
} from "../schemas/new-reservation-form";
import { formatDateTimeRange } from "../utils/date-format";

const defaultValues: NewReservationFormValues = {
  place_id: "",
  space_id: "",
  customer_email: "",
  reservation_date: "",
  start_time: "",
  end_time: ""
};

export const NewReservationView = () => {
  const navigate = useNavigate();
  const placesQuery = usePlaces();
  const spacesQuery = useSpaces();
  const createMutation = useCreateReservation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availableWindows, setAvailableWindows] = useState<
    Array<{ startsAt: string; endsAt: string }>
  >([]);

  const form = useForm<NewReservationFormValues>({
    resolver: zodResolver(newReservationFormSchema),
    defaultValues,
    mode: "onTouched"
  });

  const selectedPlaceId = form.watch("place_id");
  const selectedSpaceId = form.watch("space_id");
  const reservationDate = form.watch("reservation_date");
  const startTime = form.watch("start_time");
  const endTime = form.watch("end_time");
  const availabilityQuery = useSpaceAvailability(selectedSpaceId, reservationDate);

  const spacesForPlace = useMemo(
    () =>
      (spacesQuery.data ?? []).filter(
        (space) => space.placeId === selectedPlaceId
      ),
    [spacesQuery.data, selectedPlaceId]
  );

  const clearSubmitFeedback = () => {
    setSubmitError(null);
    setAvailableWindows([]);
    createMutation.reset();
  };

  const resetTimeFields = () => {
    form.resetField("start_time", { defaultValue: "" });
    form.resetField("end_time", { defaultValue: "" });
  };

  const placeField = form.register("place_id", {
    onChange: () => {
      form.resetField("space_id", { defaultValue: "" });
      form.resetField("reservation_date", { defaultValue: "" });
      resetTimeFields();
      clearSubmitFeedback();
    }
  });

  const spaceField = form.register("space_id", {
    onChange: () => {
      resetTimeFields();
      clearSubmitFeedback();
    }
  });

  const reservationDateField = form.register("reservation_date", {
    onChange: () => {
      resetTimeFields();
      clearSubmitFeedback();
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null);
    setAvailableWindows([]);
    const startsAt = `${values.reservation_date}T${values.start_time}`;
    const endsAt = `${values.reservation_date}T${values.end_time}`;

    createMutation.mutate(
      {
        placeId: values.place_id,
        spaceId: values.space_id,
        customerEmail: values.customer_email,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString()
      },
      {
        onSuccess: () => {
          setSubmitError(null);
          toast.success("Reservation created.");
          navigate("/reservations");
        },
        onError: (error) => {
          const apiError = normalizeApiError(error);
          const message = apiError.message;
          setSubmitError(message);
          setAvailableWindows(extractAvailableWindows(apiError.details));
          toast.error(message);
        }
      }
    );
  });

  const errors = form.formState.errors;

  return (
    <section className="space-y-8">
      <Link
        to="/reservations"
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-1 text-sm font-semibold text-slate-500 transition hover:text-brand-700"
      >
        <ChevronLeftIcon size={16} />
        Back to reservations
      </Link>

      <PageHeader
        eyebrow="New booking"
        title="Create reservation"
        description="Pick a place and space, then choose one day and the hourly range for your reservation."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Card className="overflow-hidden">
          <form onSubmit={onSubmit} noValidate>
            <div className="grid lg:grid-cols-2">
              <FormSection
                icon={<CalendarIcon size={21} />}
                title="Where"
                description="Select the location and space for your reservation."
              >
                <div className="grid gap-5">
                  <Field
                    id="place_id"
                    label="Place"
                    error={errors.place_id?.message}
                    hint={placesQuery.isLoading ? "Loading places..." : "Choose the location where your reservation will take place."}
                  >
                    <select
                      id="place_id"
                      {...placeField}
                      disabled={placesQuery.isLoading || placesQuery.isError}
                      className={inputStyles(Boolean(errors.place_id))}
                    >
                      <option value="">Select a place</option>
                      {(placesQuery.data ?? []).map((place) => (
                        <option key={place.id} value={place.id}>
                          {place.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    id="space_id"
                    label="Space"
                    error={errors.space_id?.message}
                    hint={
                      !selectedPlaceId
                        ? "Pick a place first"
                        : spacesForPlace.length === 0
                          ? "No spaces in this place"
                          : "Pick a specific space. Capacity is shown in the option."
                    }
                  >
                    <select
                      id="space_id"
                      {...spaceField}
                      disabled={!selectedPlaceId || spacesForPlace.length === 0}
                      className={inputStyles(Boolean(errors.space_id))}
                    >
                      <option value="">Select a space</option>
                      {spacesForPlace.map((space) => (
                        <option key={space.id} value={space.id}>
                          {space.name} (cap {space.capacity})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </FormSection>

              <FormSection
                icon={<MailIcon size={21} />}
                title="Who"
                description="Provide the primary contact for this reservation."
                className="border-t border-slate-200/80 lg:border-l lg:border-t-0"
              >
                <Field
                  id="customer_email"
                  label="Customer email"
                  error={errors.customer_email?.message}
                  hint="We'll use this email to identify the booking."
                >
                  <input
                    id="customer_email"
                    type="email"
                    autoComplete="email"
                    placeholder="customer@example.com"
                    {...form.register("customer_email")}
                    className={inputStyles(Boolean(errors.customer_email))}
                  />
                </Field>
              </FormSection>
            </div>

            <div className="border-t border-slate-200/80 p-6 sm:p-8">
              <div className="mb-6 flex items-start gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <CalendarIcon size={21} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">When</h2>
                  <p className="text-sm text-slate-500">
                    Choose a reservation date, then define the start and end hour inside that same day.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <Field
                  id="reservation_date"
                  label="Reservation date"
                  error={errors.reservation_date?.message}
                  hint="This day will be used for both the start and end timestamps."
                >
                  <input
                    id="reservation_date"
                    type="date"
                    {...reservationDateField}
                    onClick={openNativePicker}
                    className={inputStyles(Boolean(errors.reservation_date))}
                  />
                </Field>
                <Field
                  id="start_time"
                  label="Start time"
                  error={errors.start_time?.message}
                  hint="Pick the hour when the reservation should begin."
                >
                  <input
                    id="start_time"
                    type="time"
                    step={3600}
                    {...form.register("start_time")}
                    onClick={openNativePicker}
                    className={inputStyles(Boolean(errors.start_time))}
                  />
                </Field>
                <Field
                  id="end_time"
                  label="End time"
                  error={errors.end_time?.message}
                  hint="Pick the hour when the reservation should finish."
                >
                  <input
                    id="end_time"
                    type="time"
                    step={3600}
                    {...form.register("end_time")}
                    onClick={openNativePicker}
                    className={inputStyles(Boolean(errors.end_time))}
                  />
                </Field>
              </div>

              <div className="mt-6">
                <ReservationTimeRangeTimeline
                  reservationDate={reservationDate}
                  startTime={startTime}
                  endTime={endTime}
                  availableWindows={availabilityQuery.data?.availableWindows ?? []}
                  reservedWindows={availabilityQuery.data?.reservedWindows ?? []}
                  isLoading={availabilityQuery.isLoading}
                  isReady={
                    typeof selectedSpaceId === "string" &&
                    selectedSpaceId.length > 0 &&
                    /^\d{4}-\d{2}-\d{2}$/.test(reservationDate)
                  }
                  isError={availabilityQuery.isError}
                />
              </div>
            </div>

            {submitError ? (
              <div className="px-6 pb-6 sm:px-8">
                <div
                  role="alert"
                  className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800"
                >
                  <AlertCircleIcon size={20} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Cannot create reservation</p>
                    <p className="mt-1">{submitError}</p>
                    {availableWindows.length > 0 ? (
                      <div className="mt-4 border-t border-rose-200 pt-4">
                        <p className="font-semibold text-rose-900">
                          Available today for this space
                        </p>
                        <ul className="mt-2 space-y-1">
                          {availableWindows.map((window) => (
                            <li key={`${window.startsAt}-${window.endsAt}`}>
                              {formatDateTimeRange(window.startsAt, window.endsAt)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : createMutation.isError ? (
                      <p className="mt-3 font-medium text-rose-900">
                        No available windows remain for this space on the selected day.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-end sm:p-8">
              <Link to="/reservations" className={buttonClasses("secondary", "md")}>
                Cancel
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create reservation"}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </section>
  );
};

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

const Field = ({ id, label, error, hint, children }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}
    </label>
    {children}
    {error ? (
      <p role="alert" className="text-xs font-medium text-rose-600">
        {error}
      </p>
    ) : hint ? (
      <p className="text-xs text-slate-500">{hint}</p>
    ) : null}
  </div>
);

const inputStyles = (hasError: boolean): string =>
  cn(
    "min-h-12 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-900/[0.02] transition",
    "focus:outline-none focus:ring-4",
    hasError
      ? "border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-100"
      : "border-slate-200 hover:border-slate-300 focus:border-brand-400 focus:ring-brand-100",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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

const extractAvailableWindows = (
  details: Record<string, unknown>
): Array<{ startsAt: string; endsAt: string }> => {
  const windows = details.available_windows;
  if (!Array.isArray(windows)) return [];

  return windows.flatMap((window) => {
    if (
      typeof window === "object" &&
      window !== null &&
      "starts_at" in window &&
      "ends_at" in window
    ) {
      return [
        {
          startsAt: String(window.starts_at),
          endsAt: String(window.ends_at)
        }
      ];
    }

    return [];
  });
};

type FormSectionProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
};

const FormSection = ({
  icon,
  title,
  description,
  children,
  className
}: FormSectionProps) => (
  <section className={cn("space-y-6 p-6 sm:p-8", className)}>
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        {icon}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
    {children}
  </section>
);
