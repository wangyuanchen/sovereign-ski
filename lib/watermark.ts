import sharp from "sharp";

const BRAND = "ski.svgn.org";

/**
 * Overlay a semi-transparent watermark on an image (data URL → data URL).
 * The watermark is a repeating diagonal pattern of the brand URL —
 * subtle enough to not ruin the image, annoying enough to encourage upgrading.
 */
export async function addWatermarkToImage(dataUrl: string): Promise<string> {
  // Parse data URL
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return dataUrl;
  const [, , b64] = match;
  const buf = Buffer.from(b64, "base64");

  const img = sharp(buf);
  const meta = await img.metadata();
  const w = meta.width ?? 1080;
  const h = meta.height ?? 1920;

  // Build an SVG overlay with repeating diagonal watermark text + bottom brand bar
  const fontSize = Math.round(w / 22);
  const barHeight = Math.round(h * 0.045);
  const barFontSize = Math.round(barHeight * 0.55);
  const spacing = Math.round(fontSize * 4.5);

  // Generate repeating watermark lines
  const lines: string[] = [];
  for (let y = -h; y < h * 2; y += spacing) {
    for (let x = -w; x < w * 2; x += spacing) {
      lines.push(
        `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="'Helvetica Neue',Arial,sans-serif" font-weight="700" fill="white" opacity="0.09" transform="rotate(-30, ${x}, ${y})">${BRAND}</text>`,
      );
    }
  }

  // Bottom brand bar for virality
  const barSvg = `
    <rect x="0" y="${h - barHeight}" width="${w}" height="${barHeight}" fill="black" opacity="0.55"/>
    <text x="${w / 2}" y="${h - barHeight / 2 + barFontSize * 0.35}" font-size="${barFontSize}" font-family="'Helvetica Neue',Arial,sans-serif" font-weight="600" fill="white" opacity="0.85" text-anchor="middle" letter-spacing="2">${BRAND}  ·  生成你的专属滑雪战绩卡</text>
  `;

  const overlaySvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      ${lines.join("\n")}
      ${barSvg}
    </svg>`,
  );

  const result = await img
    .composite([{ input: overlaySvg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${result.toString("base64")}`;
}
