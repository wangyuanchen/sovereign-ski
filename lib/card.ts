import type { SkiSessionFormValues } from "@/lib/schema";
import type { SkiThemeTokens } from "@/lib/themes/ski";
import { computeSkiDaySummary } from "@/lib/ski-summary";

export type CardLabels = {
  kmh: string;
  duration: string;
  distance: string;
  vertical: string;
  numberLocale: string;
  tripDay: string;
  runsUnit: string;
  totalDistance: string;
  totalVertical: string;
  sessionRuns: string;
  runListMore: string;
};

const FONT_DISPLAY = '"Bebas Neue", system-ui, sans-serif';
const FONT_UI = '"Syne", system-ui, sans-serif';
const FONT_NUM = '"JetBrains Mono", ui-monospace, monospace';

function addNoise(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
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
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawSheen(ctx: CanvasRenderingContext2D, w: number, h: number, theme: SkiThemeTokens) {
  const [a, b, c, d] = theme.sheenDiagonal;
  const g = ctx.createLinearGradient(0, 0, w * 1.1, h * 1.1);
  g.addColorStop(0, a);
  g.addColorStop(0.35, b);
  g.addColorStop(0.65, c);
  g.addColorStop(1, d);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  const [r0, r1] = theme.sheenRadial;
  const g2 = ctx.createRadialGradient(w * 0.2, h * 0.15, 0, w * 0.2, h * 0.15, w * 0.9);
  g2.addColorStop(0, r0);
  g2.addColorStop(1, r1);
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
  session: SkiSessionFormValues,
  theme: SkiThemeTokens,
  w: number,
  h: number,
  labels: CardLabels,
  options?: { watermark?: boolean },
) {
  const runs = session.runs;
  const summary = computeSkiDaySummary(runs);
  const scale = Math.min(w / 1080, h / 1920);
  const single = runs.length === 1;
  const first = runs[0]!;

  ctx.save();
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, w, h);
  drawSheen(ctx, w, h, theme);
  addNoise(ctx, w, h, theme.noiseAlpha);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (single) {
    ctx.font = `600 ${36 * scale}px ${FONT_UI}`;
    ctx.fillStyle = theme.textMuted;
    const title = (first.resort.trim() || "—").toUpperCase();
    ctx.fillText(title, w / 2, h * (120 / 1920));

    ctx.font = `500 ${26 * scale}px ${FONT_UI}`;
    ctx.fillText(session.dayDate, w / 2, h * (168 / 1920));

    const speed = Math.round(first.max_speed_kmh);
    ctx.fillStyle = theme.accent;
    ctx.font = `400 ${Math.min(220 * scale, h * 0.12)}px ${FONT_DISPLAY}`;
    ctx.fillText(String(speed), w / 2, h * 0.44);

    ctx.font = `600 ${42 * scale}px ${FONT_UI}`;
    ctx.fillStyle = theme.textMuted;
    ctx.fillText(labels.kmh, w / 2, h * 0.44 + 120 * scale);

    const rowY = h * 0.62;
    const cols = 3;
    const colW = w / cols;
    const cells: { label: string; value: string }[] = [
      { label: labels.duration, value: first.duration },
      { label: labels.distance, value: `${formatKm(first.distance_km, labels.numberLocale)} km` },
      { label: labels.vertical, value: `${first.vertical_m} m` },
    ];
    cells.forEach((cell, i) => {
      const cx = colW * i + colW / 2;
      ctx.font = `600 ${24 * scale}px ${FONT_UI}`;
      ctx.fillStyle = theme.textMuted;
      ctx.fillText(cell.label, cx, rowY);
      ctx.font = `800 ${40 * scale}px ${FONT_NUM}`;
      ctx.fillStyle = theme.text;
      ctx.fillText(cell.value, cx, rowY + 64 * scale);
    });
  } else {
    ctx.font = `600 ${32 * scale}px ${FONT_UI}`;
    ctx.fillStyle = theme.textMuted;
    ctx.fillText(labels.tripDay, w / 2, h * (100 / 1920));

    ctx.font = `500 ${26 * scale}px ${FONT_UI}`;
    ctx.fillText(session.dayDate, w / 2, h * (145 / 1920));

    ctx.font = `600 ${22 * scale}px ${FONT_UI}`;
    ctx.fillText(`${summary.runCount} ${labels.runsUnit}`, w / 2, h * (185 / 1920));

    const speed = Math.round(summary.maxSpeedKmh);
    ctx.fillStyle = theme.accent;
    ctx.font = `400 ${Math.min(200 * scale, h * 0.11)}px ${FONT_DISPLAY}`;
    ctx.fillText(String(speed), w / 2, h * 0.4);

    ctx.font = `600 ${36 * scale}px ${FONT_UI}`;
    ctx.fillStyle = theme.textMuted;
    ctx.fillText(labels.kmh, w / 2, h * 0.4 + 100 * scale);

    const rowY = h * 0.56;
    const cols = 3;
    const colW = w / cols;
    const cells: { label: string; value: string }[] = [
      {
        label: labels.totalDistance,
        value: `${formatKm(summary.totalDistanceKm, labels.numberLocale)} km`,
      },
      { label: labels.totalVertical, value: `${summary.totalVerticalM} m` },
      { label: labels.sessionRuns, value: String(summary.runCount) },
    ];
    cells.forEach((cell, i) => {
      const cx = colW * i + colW / 2;
      ctx.font = `600 ${22 * scale}px ${FONT_UI}`;
      ctx.fillStyle = theme.textMuted;
      ctx.fillText(cell.label, cx, rowY);
      ctx.font = `800 ${34 * scale}px ${FONT_NUM}`;
      ctx.fillStyle = theme.text;
      ctx.fillText(cell.value, cx, rowY + 56 * scale);
    });

    const listTop = h * 0.68;
    const lineH = Math.max(40, 52 * scale);
    const maxLines = h < 1400 ? 3 : 6;
    const slice = runs.slice(0, maxLines);
    ctx.textAlign = "left";
    ctx.font = `500 ${20 * scale}px ${FONT_UI}`;
    slice.forEach((run, i) => {
      const y = listTop + i * lineH;
      const line = `${run.resort.trim() || "—"} · ${formatKm(run.distance_km, labels.numberLocale)} km · ${run.vertical_m} m`;
      const cut = line.length > 42 ? `${line.slice(0, 40)}…` : line;
      ctx.fillStyle = theme.textMuted;
      ctx.fillText(cut, 48 * scale, y);
    });
    if (runs.length > maxLines) {
      ctx.fillStyle = "rgba(232, 244, 253, 0.35)";
      ctx.font = `500 ${18 * scale}px ${FONT_UI}`;
      ctx.fillText(
        labels.runListMore.replace("{n}", String(runs.length - maxLines)),
        48 * scale,
        listTop + slice.length * lineH,
      );
    }
  }

  /* ── Watermark ── */
  const showWatermark = options?.watermark !== false; // default: on

  if (showWatermark) {
    // Bottom-right badge: "ski.svgn.org" with accent pill background
    const wmText = "ski.svgn.org";
    const wmFontSize = Math.max(18, 24 * scale);
    ctx.font = `600 ${wmFontSize}px ${FONT_UI}`;
    const wmMetrics = ctx.measureText(wmText);
    const wmPadX = 16 * scale;
    const wmPadY = 8 * scale;
    const wmW = wmMetrics.width + wmPadX * 2;
    const wmH = wmFontSize + wmPadY * 2;
    const wmX = w - wmW - 32 * scale;
    const wmY = h - wmH - 32 * scale;

    // Pill background
    const wmRadius = wmH / 2;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = theme.bg;
    ctx.beginPath();
    ctx.roundRect(wmX, wmY, wmW, wmH, wmRadius);
    ctx.fill();
    ctx.restore();

    // Border
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.roundRect(wmX, wmY, wmW, wmH, wmRadius);
    ctx.stroke();
    ctx.restore();

    // Text
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = theme.accent;
    ctx.font = `600 ${wmFontSize}px ${FONT_UI}`;
    ctx.fillText(wmText, wmX + wmW / 2, wmY + wmH / 2);
    ctx.restore();
  } else {
    // Paid users: subtle credit line only
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.font = `500 ${18 * scale}px ${FONT_UI}`;
    ctx.fillStyle = "rgba(232, 244, 253, 0.2)";
    ctx.fillText("ski.svgn.org", w - 40 * scale, h - 40 * scale);
  }

  ctx.restore();
}

export function fileNameFromCard(session: SkiSessionFormValues) {
  const date = session.dayDate.replace(/[^\d-]/g, "");
  return `skicard_${date}_${session.themeId}_${session.aspectId}.png`;
}
