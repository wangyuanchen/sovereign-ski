import { skiSessionFormSchema } from "@/lib/schema";
import type { SkiSessionFormValues } from "@/lib/schema";
import { defaultSkiSessionFormValues, defaultSkiRunRow } from "@/lib/schema";

export type ParsedSkiPartial = {
  resort: string | null;
  date: string | null;
  duration: string | null;
  distance_km: number | null;
  max_speed_kmh: number | null;
  vertical_m: number | null;
};

export const STORAGE_KEY = "ski-card-draft";

/** 将单次解析结果并入默认会话（单日第一场） */
export function parsedPartialToSession(p: ParsedSkiPartial): SkiSessionFormValues {
  const base = defaultSkiSessionFormValues();
  const today = new Date().toISOString().slice(0, 10);
  const dayDate = p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : today;
  const row = defaultSkiRunRow();
  return {
    ...base,
    dayDate,
    runs: [
      {
        ...row,
        resort: p.resort?.trim() || "",
        duration: p.duration?.trim() || "—",
        distance_km: p.distance_km ?? 0,
        max_speed_kmh: p.max_speed_kmh ?? 0,
        vertical_m: p.vertical_m ?? 0,
      },
    ],
  };
}

export function parseStoredSession(raw: unknown): SkiSessionFormValues | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  if (o.sport === "ski" && Array.isArray(o.runs)) {
    const r = skiSessionFormSchema.safeParse(raw);
    return r.success ? r.data : null;
  }

  if ("resort" in o && !("runs" in o)) {
    const p = o as ParsedSkiPartial;
    return parsedPartialToSession(p);
  }

  return null;
}

export function defaultFormValues(): SkiSessionFormValues {
  return defaultSkiSessionFormValues();
}
