import { z } from "zod";

export const visitFormSchema = z.object({
  type: z.enum(["vaccination", "checkup", "emergency", "other"]),
  title: z.string().min(1, "Please enter a title for this visit"),
  notes: z.string(),
  scheduledDate: z.date(),
  reminderDays: z.number(),
});

export type VisitFormData = z.infer<typeof visitFormSchema>;
