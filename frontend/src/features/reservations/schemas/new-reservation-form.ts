import { z } from "zod";

export const newReservationFormSchema = z
  .object({
    place_id: z.string().min(1, "A place is required"),
    space_id: z.string().min(1, "A space is required"),
    customer_email: z.string().email("Enter a valid email"),
    reservation_date: z.string().min(1, "Reservation date is required"),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required")
  })
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true;

      const starts = new Date(`1970-01-01T${data.start_time}`);
      const ends = new Date(`1970-01-01T${data.end_time}`);
      return ends.getTime() > starts.getTime();
    },
    { path: ["end_time"], message: "End must be after start" }
  );

export type NewReservationFormValues = z.input<typeof newReservationFormSchema>;
