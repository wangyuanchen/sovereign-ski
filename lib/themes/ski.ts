import type { SportId } from "@/lib/sports/types";

export type SkiThemeId = "default" | "night" | "powder";

export type SkiThemeTokens = {
  id: SkiThemeId;
  sport: SportId;
  /** i18n key under `card.theme*` */
  labelKey: string;
  bg: string;
  accent: string;
  text: string;
  textMuted: string;
  sheenDiagonal: [string, string, string, string];
  sheenRadial: [string, string];
  noiseAlpha: number;
};

export const SKI_THEMES: Record<SkiThemeId, SkiThemeTokens> = {
  default: {
    id: "default",
    sport: "ski",
    labelKey: "themeDefault",
    bg: "#0A1628",
    accent: "#00D4FF",
    text: "#E8F4FD",
    textMuted: "rgba(232, 244, 253, 0.55)",
    sheenDiagonal: [
      "rgba(0, 212, 255, 0.22)",
      "rgba(10, 22, 40, 0)",
      "rgba(10, 22, 40, 0)",
      "rgba(0, 212, 255, 0.12)",
    ],
    sheenRadial: ["rgba(0, 212, 255, 0.18)", "rgba(10, 22, 40, 0)"],
    noiseAlpha: 0.07,
  },
  night: {
    id: "night",
    sport: "ski",
    labelKey: "themeNight",
    bg: "#050810",
    accent: "#7CF0FF",
    text: "#EEF8FF",
    textMuted: "rgba(238, 248, 255, 0.5)",
    sheenDiagonal: [
      "rgba(80, 200, 255, 0.28)",
      "rgba(5, 8, 16, 0)",
      "rgba(5, 8, 16, 0)",
      "rgba(120, 240, 255, 0.1)",
    ],
    sheenRadial: ["rgba(100, 220, 255, 0.22)", "rgba(5, 8, 16, 0)"],
    noiseAlpha: 0.06,
  },
  powder: {
    id: "powder",
    sport: "ski",
    labelKey: "themePowder",
    bg: "#0E1A2E",
    accent: "#FFB8D9",
    text: "#F8FAFC",
    textMuted: "rgba(248, 250, 252, 0.55)",
    sheenDiagonal: [
      "rgba(255, 182, 217, 0.2)",
      "rgba(14, 26, 46, 0)",
      "rgba(14, 26, 46, 0)",
      "rgba(96, 165, 250, 0.14)",
    ],
    sheenRadial: ["rgba(147, 197, 253, 0.2)", "rgba(14, 26, 46, 0)"],
    noiseAlpha: 0.065,
  },
};

export const DEFAULT_SKI_THEME_ID: SkiThemeId = "default";

export function getSkiTheme(id: SkiThemeId | undefined): SkiThemeTokens {
  return SKI_THEMES[id ?? "default"] ?? SKI_THEMES.default;
}
