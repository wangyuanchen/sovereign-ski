import { z } from "zod";
import type { AspectId } from "@/lib/aspect";
import { DEFAULT_ASPECT_ID } from "@/lib/aspect";
import type { SkiThemeId } from "@/lib/themes/ski";
import { DEFAULT_SKI_THEME_ID } from "@/lib/themes/ski";
import { DEFAULT_SPORT, type SportId } from "@/lib/sports/types";

export type SkiFormMessages = {
  resortMin: string;
  datePattern: string;
  durationMin: string;
};

const themeEnum = z.enum(["default", "night", "powder"]);
const aspectEnum = z.enum(["story_9_16", "feed_3_4", "square_1_1"]);

/** 单场滑行（一日内可多条）— 无 messages 的基底，用于 API 校验 */
export const skiRunRowSchema = z.object({
  id: z.string().min(1),
  resort: z.string().min(1).max(100),
  duration: z.string().min(1).max(20),
  distance_km: z.coerce.number().min(0),
  max_speed_kmh: z.coerce.number().min(0),
  vertical_m: z.coerce.number().int().min(0),
});

export type SkiRunRow = z.infer<typeof skiRunRowSchema>;

/** 滑雪会话：单日汇总 + 多段滑行 + 本地主题/比例（不调用模型） */
export const skiSessionFormSchema = z.object({
  sport: z.literal("ski"),
  dayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  themeId: themeEnum,
  aspectId: aspectEnum,
  runs: z.array(skiRunRowSchema).min(1).max(24),
});

export type SkiSessionFormValues = z.infer<typeof skiSessionFormSchema>;

export function createSkiSessionSchema(messages: SkiFormMessages) {
  const runRow = z.object({
    id: z.string().min(1),
    resort: z.string().min(1, messages.resortMin).max(100),
    duration: z.string().min(1, messages.durationMin).max(20),
    distance_km: z.coerce.number().min(0),
    max_speed_kmh: z.coerce.number().min(0),
    vertical_m: z.coerce.number().int().min(0),
  });
  return z.object({
    sport: z.literal("ski"),
    dayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, messages.datePattern),
    themeId: themeEnum,
    aspectId: aspectEnum,
    runs: z.array(runRow).min(1).max(24),
  });
}

/** @deprecated 单条表单，仅用于兼容旧引用；新代码请用 SkiSessionFormValues */
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

/** POST /api/records：当日多场，每条一行，日期共用 dayDate */
export const recordSessionBodySchema = z.object({
  dayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  runs: z
    .array(
      z.object({
        resort: z.string().min(1).max(100),
        duration: z.string().min(1).max(20),
        distance_km: z.coerce.number().min(0),
        max_speed_kmh: z.coerce.number().min(0),
        vertical_m: z.coerce.number().int().min(0),
      }),
    )
    .min(1)
    .max(24),
});

/** POST /api/generate-share */
export const generateShareBodySchema = skiSessionFormSchema.extend({
  locale: z.enum(["zh", "en"]).optional(),
});

export function defaultSkiRunRow(): SkiRunRow {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `run-${Date.now()}`,
    resort: "",
    duration: "—",
    distance_km: 0,
    max_speed_kmh: 0,
    vertical_m: 0,
  };
}

export function defaultSkiSessionFormValues(): SkiSessionFormValues {
  const today = new Date().toISOString().slice(0, 10);
  const run = defaultSkiRunRow();
  return {
    sport: DEFAULT_SPORT as "ski",
    dayDate: today,
    themeId: DEFAULT_SKI_THEME_ID as SkiThemeId,
    aspectId: DEFAULT_ASPECT_ID as AspectId,
    runs: [run],
  };
}

/** 供后续多运动路由使用 */
export function defaultSessionForSport(sport: SportId): SkiSessionFormValues {
  switch (sport) {
    case "ski":
    default:
      return defaultSkiSessionFormValues();
  }
}
