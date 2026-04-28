import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { normalizeApiError } from "../../../shared/api/errors";
import { uiTerms } from "../../../shared/i18n";
import { Button, Card, cn } from "../../../shared/ui";
import { useUpdateDeviceDesired } from "../hooks/use-monitoring";
import {
  deviceDesiredFormSchema,
  type DeviceDesired,
  type DeviceDesiredFormValues
} from "../schemas/device";

type DeviceDesiredFormProps = {
  spaceId: string;
  desired: DeviceDesired | null;
};

export const DeviceDesiredForm = ({
  spaceId,
  desired
}: DeviceDesiredFormProps) => {
  const mutation = useUpdateDeviceDesired();

  const form = useForm<DeviceDesiredFormValues>({
    resolver: zodResolver(deviceDesiredFormSchema),
    mode: "onTouched",
    defaultValues: {
      sampling_interval_sec: desired?.samplingIntervalSec ?? 10,
      co2_alert_threshold: desired?.co2AlertThreshold ?? 1000
    }
  });

  useEffect(() => {
    if (!form.formState.isDirty) {
      form.reset({
        sampling_interval_sec: desired?.samplingIntervalSec ?? 10,
        co2_alert_threshold: desired?.co2AlertThreshold ?? 1000
      });
    }
  }, [desired?.samplingIntervalSec, desired?.co2AlertThreshold, form]);

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(
      {
        spaceId,
        samplingIntervalSec: Number(values.sampling_interval_sec),
        co2AlertThreshold: Number(values.co2_alert_threshold)
      },
      {
        onSuccess: () => {
          toast.success("El estado deseado se actualizó y se publicó.");
          form.reset(values);
        },
        onError: (error) => {
          toast.error(normalizeApiError(error).message);
        }
      }
    );
  });

  const errors = form.formState.errors;

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate className="space-y-5 p-6">
        <header>
          <h3 className="text-sm font-semibold text-slate-900">
            Actualizar estado deseado
          </h3>
          <p className="text-xs text-slate-500">
            Envía un nuevo payload <code className="font-mono text-[11px]">desired</code>{" "}
            por MQTT. El dispositivo confirma mediante{" "}
            <code className="font-mono text-[11px]">reported</code>.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="sampling_interval_sec"
            label="Intervalo de muestreo (segundos)"
            error={errors.sampling_interval_sec?.message}
          >
            <input
              id="sampling_interval_sec"
              type="number"
              min={1}
              max={3600}
              step={1}
              {...form.register("sampling_interval_sec")}
              className={inputStyles(Boolean(errors.sampling_interval_sec))}
            />
          </Field>
          <Field
            id="co2_alert_threshold"
            label="Umbral de alerta de CO₂ (ppm)"
            error={errors.co2_alert_threshold?.message}
          >
            <input
              id="co2_alert_threshold"
              type="number"
              min={1}
              max={10000}
              step={1}
              {...form.register("co2_alert_threshold")}
              className={inputStyles(Boolean(errors.co2_alert_threshold))}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              form.reset({
                sampling_interval_sec: desired?.samplingIntervalSec ?? 10,
                co2_alert_threshold: desired?.co2AlertThreshold ?? 1000
              })
            }
            disabled={!form.formState.isDirty || mutation.isPending}
          >
            {uiTerms.actions.reset}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !form.formState.isDirty}
          >
            {mutation.isPending ? uiTerms.actions.publishing : uiTerms.actions.publishUpdate}
          </Button>
        </div>
      </form>
    </Card>
  );
};

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
};

const Field = ({ id, label, error, children }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}
    </label>
    {children}
    {error ? (
      <p role="alert" className="text-xs font-medium text-rose-600">
        {error}
      </p>
    ) : null}
  </div>
);

const inputStyles = (hasError: boolean): string =>
  cn(
    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition",
    "focus:outline-none focus:ring-2",
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
      : "border-slate-200 hover:border-slate-300 focus:border-brand-400 focus:ring-brand-200"
  );
