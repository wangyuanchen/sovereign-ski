import type { SkiFormValues } from "@/lib/schema";

export type ParsedSkiPartial = {
  resort: string | null;
  date: string | null;
  duration: string | null;
  distance_km: number | null;
  max_speed_kmh: number | null;
  vertical_m: number | null;
};

export const STORAGE_KEY = "ski-card-draft";

export function parsedToFormValues(p: ParsedSkiPartial): SkiFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    resort: p.resort?.trim() || "",
    date: p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : today,
    duration: p.duration?.trim() || "—",
    distance_km: p.distance_km ?? 0,
    max_speed_kmh: p.max_speed_kmh ?? 0,
    vertical_m: p.vertical_m ?? 0,
  };
}

export function defaultFormValues(): SkiFormValues {
  return parsedToFormValues({
    resort: null,
    date: null,
    duration: null,
    distance_km: null,
    max_speed_kmh: null,
    vertical_m: null,
  });
}
