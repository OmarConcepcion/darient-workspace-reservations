import { z } from "zod";

export const newReservationFormSchema = z
  .object({
    place_id: z.string().min(1, "A place is required"),
    space_id: z.string().min(1, "A space is required"),
    customer_email: z.string().email("Enter a valid email"),
    starts_at: z.string().min(1, "Start time is required"),
    ends_at: z.string().min(1, "End time is required")
  })
  .refine(
    (data) => {
      const starts = new Date(data.starts_at);
      const ends = new Date(data.ends_at);
      return (
        !Number.isNaN(starts.getTime()) &&
        !Number.isNaN(ends.getTime()) &&
        ends.getTime() > starts.getTime()
      );
    },
    { path: ["ends_at"], message: "End must be after start" }
  );

export type NewReservationFormValues = z.input<typeof newReservationFormSchema>;
