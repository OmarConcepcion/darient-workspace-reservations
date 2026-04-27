import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
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
import { useSpaces } from "../../spaces";
import { useCreateReservation } from "../hooks/use-reservations";
import {
  newReservationFormSchema,
  type NewReservationFormValues
} from "../schemas/new-reservation-form";

const defaultValues: NewReservationFormValues = {
  place_id: "",
  space_id: "",
  customer_email: "",
  starts_at: "",
  ends_at: ""
};

export const NewReservationView = () => {
  const navigate = useNavigate();
  const placesQuery = usePlaces();
  const spacesQuery = useSpaces();
  const createMutation = useCreateReservation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<NewReservationFormValues>({
    resolver: zodResolver(newReservationFormSchema),
    defaultValues,
    mode: "onTouched"
  });

  const selectedPlaceId = form.watch("place_id");

  useEffect(() => {
    form.setValue("space_id", "", { shouldValidate: false });
  }, [selectedPlaceId, form]);

  const spacesForPlace = useMemo(
    () =>
      (spacesQuery.data ?? []).filter(
        (space) => space.placeId === selectedPlaceId
      ),
    [spacesQuery.data, selectedPlaceId]
  );

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null);
    createMutation.mutate(
      {
        placeId: values.place_id,
        spaceId: values.space_id,
        customerEmail: values.customer_email,
        startsAt: new Date(values.starts_at).toISOString(),
        endsAt: new Date(values.ends_at).toISOString()
      },
      {
        onSuccess: () => {
          setSubmitError(null);
          toast.success("Reservation created.");
          navigate("/reservations");
        },
        onError: (error) => {
          const message = normalizeApiError(error).message;
          setSubmitError(message);
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
        description="Pick a place and space, then choose a time window. We'll handle the rest."
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
                      {...form.register("place_id")}
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
                      {...form.register("space_id")}
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
                    Choose the start and end date and time for your reservation.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Field
                  id="starts_at"
                  label="Starts at"
                  error={errors.starts_at?.message}
                >
                  <input
                    id="starts_at"
                    type="datetime-local"
                    {...form.register("starts_at")}
                    className={inputStyles(Boolean(errors.starts_at))}
                  />
                </Field>
                <Field
                  id="ends_at"
                  label="Ends at"
                  error={errors.ends_at?.message}
                >
                  <input
                    id="ends_at"
                    type="datetime-local"
                    {...form.register("ends_at")}
                    className={inputStyles(Boolean(errors.ends_at))}
                  />
                </Field>
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
