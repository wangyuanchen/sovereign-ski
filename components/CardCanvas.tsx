"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import type { SkiFormValues } from "@/lib/schema";
import { CARD_H, CARD_W, drawSkiCard, fileNameFromCard, type CardLabels } from "@/lib/card";

export type CardCanvasHandle = {
  downloadPng: () => void;
};

type Props = {
  data: SkiFormValues;
  className?: string;
};

export const CardCanvas = forwardRef<CardCanvasHandle, Props>(function CardCanvas(
  { data, className },
  ref,
) {
  const t = useTranslations("card");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const labels: CardLabels = useMemo(
    () => ({
      kmh: t("kmh"),
      duration: t("duration"),
      distance: t("distance"),
      vertical: t("vertical"),
      numberLocale: t("numberLocale"),
    }),
    [t],
  );

  useEffect(() => {
    let cancelled = false;
    async function paint() {
      await Promise.all([
        document.fonts.load(`400 ${CARD_W / 5}px "Bebas Neue"`),
        document.fonts.load(`800 40px "JetBrains Mono"`),
        document.fonts.load(`600 36px "Syne"`),
      ]);
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawSkiCard(ctx, data, CARD_W, CARD_H, labels);
    }
    void paint();
    return () => {
      cancelled = true;
    };
  }, [data, labels]);

  useImperativeHandle(ref, () => ({
    downloadPng: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileNameFromCard(data);
          a.click();
          URL.revokeObjectURL(url);

          void fetch("/api/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
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
        width={CARD_W}
        height={CARD_H}
        className="h-auto w-full max-w-[min(100%,420px)] rounded-2xl border border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
      />
    </div>
  );
});

CardCanvas.displayName = "CardCanvas";
