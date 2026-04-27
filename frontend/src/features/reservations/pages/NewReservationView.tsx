import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { normalizeApiError } from "../../../shared/api/errors";
import {
  Button,
  buttonClasses,
  Card,
  ChevronLeftIcon,
  cn,
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
          toast.success("Reservation created.");
          navigate("/reservations");
        },
        onError: (error) => {
          toast.error(normalizeApiError(error).message);
        }
      }
    );
  });

  const errors = form.formState.errors;

  return (
    <section className="space-y-8">
      <Link
        to="/reservations"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
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
        <Card>
          <form onSubmit={onSubmit} noValidate className="space-y-6 p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="place_id"
                label="Place"
                error={errors.place_id?.message}
                hint={placesQuery.isLoading ? "Loading places…" : undefined}
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
                      : undefined
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

            <Field
              id="customer_email"
              label="Customer email"
              error={errors.customer_email?.message}
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

            <div className="grid gap-5 sm:grid-cols-2">
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

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <Link
                to="/reservations"
                className={buttonClasses("secondary", "md")}
              >
                Cancel
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create reservation"}
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
    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition",
    "focus:outline-none focus:ring-2",
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
      : "border-slate-200 hover:border-slate-300 focus:border-brand-400 focus:ring-brand-200",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
  );
