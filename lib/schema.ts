import { z } from "zod";

export type SkiFormMessages = {
  resortMin: string;
  datePattern: string;
  durationMin: string;
};

export function createSkiFormSchema(messages: SkiFormMessages) {
  return z.object({
    resort: z.string().min(1, messages.resortMin).max(100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, messages.datePattern),
    duration: z.string().min(1, messages.durationMin).max(20),
    distance_km: z.coerce.number().min(0),
    max_speed_kmh: z.coerce.number().min(0),
    vertical_m: z.coerce.number().int().min(0),
  });
}

export type SkiFormValues = z.infer<ReturnType<typeof createSkiFormSchema>>;

export const recordBodySchema = z.object({
  resort: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.string().min(1).max(20),
  distance_km: z.coerce.number().min(0),
  max_speed_kmh: z.coerce.number().min(0),
  vertical_m: z.coerce.number().int().min(0),
});
