import { z } from "zod";

export const newReservationFormSchema = z
  .object({
    place_id: z.string().min(1, "Debes seleccionar un lugar"),
    space_id: z.string().min(1, "Debes seleccionar una oficina"),
    customer_email: z.string().email("Ingresa un correo válido"),
    reservation_date: z.string().min(1, "La fecha de la reserva es obligatoria"),
    start_time: z.string().min(1, "La hora de inicio es obligatoria"),
    end_time: z.string().min(1, "La hora de finalización es obligatoria")
  })
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true;

      const starts = new Date(`1970-01-01T${data.start_time}`);
      const ends = new Date(`1970-01-01T${data.end_time}`);
      return ends.getTime() > starts.getTime();
    },
    {
      path: ["end_time"],
      message: "La hora de finalización debe ser posterior a la hora de inicio"
    }
  );

export type NewReservationFormValues = z.input<typeof newReservationFormSchema>;
