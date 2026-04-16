"use client";

import { useEffect, useRef } from "react";
import type { ParticleType } from "@/lib/sports/config";

type Props = {
  type: ParticleType;
  count?: number;
};

const PARTICLE_SETTINGS: Record<ParticleType, {
  className: string;
  sizeRange: [number, number];
  durationRange: [number, number];
  delayRange: [number, number];
}> = {
  snow: {
    className: "particle particle-snow",
    sizeRange: [1.5, 4.5],
    durationRange: [8, 20],
    delayRange: [0, 10],
  },
  bubble: {
    className: "particle particle-bubble",
    sizeRange: [4, 12],
    durationRange: [10, 22],
    delayRange: [0, 12],
  },
  spark: {
    className: "particle particle-spark",
    sizeRange: [1, 3],
    durationRange: [4, 10],
    delayRange: [0, 6],
  },
  leaf: {
    className: "particle particle-leaf",
    sizeRange: [4, 10],
    durationRange: [10, 20],
    delayRange: [0, 10],
  },
};

export function Particles({ type, count = 35 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const settings = PARTICLE_SETTINGS[type];

    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = settings.className;
      const size =
        Math.random() * (settings.sizeRange[1] - settings.sizeRange[0]) +
        settings.sizeRange[0];
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${
        Math.random() * (settings.durationRange[1] - settings.durationRange[0]) +
        settings.durationRange[0]
      }s`;
      p.style.animationDelay = `${
        Math.random() * (settings.delayRange[1] - settings.delayRange[0]) +
        settings.delayRange[0]
      }s`;
      p.style.opacity = `${Math.random() * 0.5 + 0.2}`;
      el.appendChild(p);
    }

    return () => {
      el.innerHTML = "";
    };
  }, [type, count]);

  return <div ref={containerRef} className="particle-container" />;
}
