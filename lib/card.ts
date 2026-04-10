import type { SkiFormValues } from "@/lib/schema";

export const CARD_W = 1080;
export const CARD_H = 1920;

export const COLORS = {
  bg: "#0A1628",
  accent: "#00D4FF",
  text: "#E8F4FD",
  textMuted: "rgba(232, 244, 253, 0.55)",
} as const;

const FONT_DISPLAY = '"Bebas Neue", system-ui, sans-serif';
const FONT_UI = '"Syne", system-ui, sans-serif';
const FONT_NUM = '"JetBrains Mono", ui-monospace, monospace';

export type CardLabels = {
  kmh: string;
  duration: string;
  distance: string;
  vertical: string;
  numberLocale: string;
};

function addNoise(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const tile = document.createElement("canvas");
  const tw = 256;
  const th = 256;
  tile.width = tw;
  tile.height = th;
  const tctx = tile.getContext("2d");
  if (!tctx) return;
  const img = tctx.createImageData(tw, th);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 180 + Math.random() * 75;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 40;
  }
  tctx.putImageData(img, 0, 0);
  const pattern = ctx.createPattern(tile, "repeat");
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawDiagonalSheen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w * 1.1, h * 1.1);
  g.addColorStop(0, "rgba(0, 212, 255, 0.22)");
  g.addColorStop(0.35, "rgba(10, 22, 40, 0)");
  g.addColorStop(0.65, "rgba(10, 22, 40, 0)");
  g.addColorStop(1, "rgba(0, 212, 255, 0.12)");
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  const g2 = ctx.createRadialGradient(w * 0.2, h * 0.15, 0, w * 0.2, h * 0.15, w * 0.9);
  g2.addColorStop(0, "rgba(0, 212, 255, 0.18)");
  g2.addColorStop(1, "rgba(10, 22, 40, 0)");
  ctx.save();
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function formatKm(n: number, numberLocale: string) {
  return n.toLocaleString(numberLocale, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

export function drawSkiCard(
  ctx: CanvasRenderingContext2D,
  data: SkiFormValues,
  w: number = CARD_W,
  h: number = CARD_H,
  labels: CardLabels,
) {
  ctx.save();
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
  drawDiagonalSheen(ctx, w, h);
  addNoise(ctx, w, h);

  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `600 36px ${FONT_UI}`;
  ctx.fillStyle = COLORS.textMuted;
  const title = (data.resort.trim() || "—").toUpperCase();
  ctx.fillText(title, w / 2, 120);

  ctx.font = `500 26px ${FONT_UI}`;
  ctx.fillText(data.date, w / 2, 168);

  const speed = Math.round(data.max_speed_kmh);
  ctx.fillStyle = COLORS.accent;
  ctx.font = `400 220px ${FONT_DISPLAY}`;
  ctx.fillText(String(speed), w / 2, h * 0.44);

  ctx.font = `600 42px ${FONT_UI}`;
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText(labels.kmh, w / 2, h * 0.44 + 120);

  const rowY = h * 0.62;
  const cols = 3;
  const colW = w / cols;
  const cells: { label: string; value: string }[] = [
    { label: labels.duration, value: data.duration },
    { label: labels.distance, value: `${formatKm(data.distance_km, labels.numberLocale)} km` },
    { label: labels.vertical, value: `${data.vertical_m} m` },
  ];

  cells.forEach((cell, i) => {
    const cx = colW * i + colW / 2;
    ctx.font = `600 24px ${FONT_UI}`;
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(cell.label, cx, rowY);

    ctx.font = `800 40px ${FONT_NUM}`;
    ctx.fillStyle = COLORS.text;
    ctx.fillText(cell.value, cx, rowY + 64);
  });

  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.font = `500 20px ${FONT_UI}`;
  ctx.fillStyle = "rgba(232, 244, 253, 0.35)";
  ctx.fillText("ski.svgn.org", w - 48, h - 48);

  ctx.restore();
}

export function fileNameFromCard(data: SkiFormValues) {
  const resort =
    (data.resort.trim() || "ski").replace(/[^\w\u4e00-\u9fff-]+/g, "_").slice(0, 40) || "ski";
  const date = data.date.replace(/[^\d-]/g, "");
  return `skicard_${resort}_${date}.png`;
}
