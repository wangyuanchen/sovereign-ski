import type { ParsedSkiPartial } from "@/lib/types";

function coerceString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function coerceNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function coerceInt(v: unknown): number | null {
  const n = coerceNumber(v);
  if (n === null) return null;
  return Math.round(n);
}

export function extractJsonFromText(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const jsonStr = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function normalizeParsedPayload(raw: unknown): ParsedSkiPartial | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  return {
    resort: obj.resort === null ? null : coerceString(obj.resort),
    date: obj.date === null ? null : coerceString(obj.date),
    duration: obj.duration === null ? null : coerceString(obj.duration),
    distance_km: coerceNumber(obj.distance_km),
    max_speed_kmh: coerceNumber(obj.max_speed_kmh),
    vertical_m: coerceInt(obj.vertical_m),
  };
}

export function parseAssistantSkiJson(text: string): ParsedSkiPartial | null {
  const raw = extractJsonFromText(text);
  return normalizeParsedPayload(raw);
}
