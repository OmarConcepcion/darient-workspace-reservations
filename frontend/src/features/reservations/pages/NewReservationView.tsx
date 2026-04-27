import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { normalizeApiError } from "../../../shared/api/errors";
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
    <section className="space-y-6">
      <nav className="text-sm">
        <Link to="/reservations" className="text-slate-500 hover:text-slate-900">
          ← Back to reservations
        </Link>
      </nav>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">New reservation</h1>
        <p className="text-sm text-slate-600">
          Pick a place and space, then choose a time window.
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
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

        <div className="grid gap-4 sm:grid-cols-2">
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

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/reservations"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? "Creating…" : "Create reservation"}
          </button>
        </div>
      </form>
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
  <div className="space-y-1">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-slate-700"
    >
      {label}
    </label>
    {children}
    {error ? (
      <p role="alert" className="text-xs text-rose-600">
        {error}
      </p>
    ) : hint ? (
      <p className="text-xs text-slate-500">{hint}</p>
    ) : null}
  </div>
);

const inputStyles = (hasError: boolean): string =>
  [
    "w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition",
    "focus:outline-none focus:ring-2 focus:ring-slate-300",
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
      : "border-slate-300 focus:border-slate-400"
  ].join(" ");
