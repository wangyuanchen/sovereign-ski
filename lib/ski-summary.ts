import type { SkiRunRow } from "@/lib/schema";

export type SkiDaySummary = {
  runCount: number;
  totalDistanceKm: number;
  totalVerticalM: number;
  maxSpeedKmh: number;
};

export function computeSkiDaySummary(runs: SkiRunRow[]): SkiDaySummary {
  if (runs.length === 0) {
    return { runCount: 0, totalDistanceKm: 0, totalVerticalM: 0, maxSpeedKmh: 0 };
  }
  let totalDistanceKm = 0;
  let totalVerticalM = 0;
  let maxSpeedKmh = 0;
  for (const r of runs) {
    totalDistanceKm += r.distance_km;
    totalVerticalM += r.vertical_m;
    maxSpeedKmh = Math.max(maxSpeedKmh, r.max_speed_kmh);
  }
  return {
    runCount: runs.length,
    totalDistanceKm,
    totalVerticalM,
    maxSpeedKmh,
  };
}
