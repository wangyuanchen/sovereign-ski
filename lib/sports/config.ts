import type { LucideIcon } from "lucide-react";
import { Mountain } from "lucide-react";
import type { SportId } from "./types";

export type ParticleType = "snow" | "bubble" | "spark" | "leaf";

export type SportConfig = {
  id: SportId;
  /** Lucide icon for hero / brand areas */
  icon: LucideIcon;
  /** CSS particle class suffix: particle-{particleType} */
  particleType: ParticleType;
  /** i18n key for the floating tagline badge */
  taglineKey: string;
  /** Emoji prefix for the badge */
  taglineEmoji: string;
};

/**
 * Registry — add a new sport here and the entire UI re-skins.
 * Colours are handled in globals.css via `[data-sport="..."]`.
 */
export const SPORT_CONFIGS: Record<SportId, SportConfig> = {
  ski: {
    id: "ski",
    icon: Mountain,
    particleType: "snow",
    taglineKey: "tagline",
    taglineEmoji: "⛷️",
  },
  // Uncomment & add to SportId union when ready:
  // surf: { id: "surf", icon: Waves, particleType: "bubble", taglineKey: "tagline", taglineEmoji: "🏄" },
  // skate: { id: "skate", icon: Flame, particleType: "spark", taglineKey: "tagline", taglineEmoji: "🛹" },
  // grass: { id: "grass", icon: TreePine, particleType: "leaf", taglineKey: "tagline", taglineEmoji: "🌿" },
};

export function getSportConfig(id: SportId): SportConfig {
  return SPORT_CONFIGS[id] ?? SPORT_CONFIGS.ski;
}

// Re-export for convenience — avoids circular import via types.ts
export { type SportId } from "./types";
