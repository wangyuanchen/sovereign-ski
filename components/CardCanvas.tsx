"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import type { SkiSessionFormValues } from "@/lib/schema";
import { ASPECT_BY_ID } from "@/lib/aspect";
import { drawSkiCard, fileNameFromCard, type CardLabels } from "@/lib/card";
import { getSkiTheme } from "@/lib/themes/ski";

export type CardCanvasHandle = {
  downloadPng: () => void;
  shareMobile: () => Promise<boolean>;
};

type Props = {
  session: SkiSessionFormValues;
  /** Whether to render a watermark. Default: true (free users). */
  watermark?: boolean;
  className?: string;
};

export const CardCanvas = forwardRef<CardCanvasHandle, Props>(function CardCanvas(
  { session, watermark = true, className },
  ref,
) {
  const t = useTranslations("card");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aspect = ASPECT_BY_ID[session.aspectId];
  const theme = getSkiTheme(session.themeId);

  const labels: CardLabels = useMemo(
    () => ({
      kmh: t("kmh"),
      duration: t("duration"),
      distance: t("distance"),
      vertical: t("vertical"),
      numberLocale: t("numberLocale"),
      tripDay: t("tripDay"),
      runsUnit: t("runsUnit"),
      totalDistance: t("totalDistance"),
      totalVertical: t("totalVertical"),
      sessionRuns: t("sessionRuns"),
      runListMore: t("runListMore"),
    }),
    [t],
  );

  useEffect(() => {
    let cancelled = false;
    async function paint() {
      const { w, h } = aspect;
      await Promise.all([
        document.fonts.load(`400 ${w / 5}px "Bebas Neue"`),
        document.fonts.load(`800 40px "JetBrains Mono"`),
        document.fonts.load(`600 36px "Syne"`),
      ]);
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawSkiCard(ctx, session, theme, w, h, labels, { watermark });
    }
    void paint();
    return () => {
      cancelled = true;
    };
  }, [aspect, labels, session, theme, watermark]);

  useImperativeHandle(ref, () => ({
    shareMobile: async () => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      return new Promise<boolean>((resolve) => {
        canvas.toBlob(
          async (blob) => {
            if (!blob) { resolve(false); return; }
            const file = new File([blob], fileNameFromCard(session), { type: "image/png" });
            if (navigator.canShare?.({ files: [file] })) {
              try {
                await navigator.share({ files: [file] });
                resolve(true);
              } catch {
                resolve(false);
              }
            } else {
              // Fallback: trigger download
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = fileNameFromCard(session);
              a.click();
              URL.revokeObjectURL(url);
              resolve(true);
            }
          },
          "image/png",
          1,
        );
      });
    },
    downloadPng: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileNameFromCard(session);
          a.click();
          URL.revokeObjectURL(url);

          void fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dayDate: session.dayDate,
              runs: session.runs.map((r) => ({
                resort: r.resort,
                duration: r.duration,
                distance_km: r.distance_km,
                max_speed_kmh: r.max_speed_kmh,
                vertical_m: r.vertical_m,
              })),
            }),
          });
        },
        "image/png",
        1,
      );
    },
  }));

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={aspect.w}
        height={aspect.h}
        className="h-auto w-full max-w-[min(100%,420px)] rounded-2xl border border-white/10 shadow-[0_30px_120px_rgb(0_0_0_/_0.55)]"
      />
    </div>
  );
});

CardCanvas.displayName = "CardCanvas";
