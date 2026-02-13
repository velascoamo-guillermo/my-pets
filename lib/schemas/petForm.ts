import { z } from "zod";

export const petFormSchema = z.object({
  name: z.string().min(1, "Please enter a name for your pet"),
  species: z.enum(["dog", "cat"]),
  birthDate: z.date().nullable(),
  imageUri: z.string().nullable(),
  vetName: z.string(),
  vetPhone: z.string(),
  vetAddress: z.string(),
});

export type PetFormData = z.infer<typeof petFormSchema>;
