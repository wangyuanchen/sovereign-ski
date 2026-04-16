export type AspectId = "story_9_16" | "feed_3_4" | "square_1_1";

export type AspectPreset = {
  id: AspectId;
  /** 导出像素（与 Canvas 一致） */
  w: number;
  h: number;
  /** i18n key under `card.` */
  labelKey: string;
};

export const ASPECT_PRESETS: AspectPreset[] = [
  { id: "story_9_16", w: 1080, h: 1920, labelKey: "aspectStory" },
  { id: "feed_3_4", w: 1080, h: 1440, labelKey: "aspectFeed" },
  { id: "square_1_1", w: 1080, h: 1080, labelKey: "aspectSquare" },
];

export const ASPECT_BY_ID: Record<AspectId, AspectPreset> = Object.fromEntries(
  ASPECT_PRESETS.map((a) => [a.id, a]),
) as Record<AspectId, AspectPreset>;

export const DEFAULT_ASPECT_ID: AspectId = "story_9_16";
