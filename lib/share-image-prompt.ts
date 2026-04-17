import { computeSkiDaySummary } from "@/lib/ski-summary";
import type { SkiSessionFormValues } from "@/lib/schema";

function fmtNum(n: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN").format(n);
}

/** 付费/按需：图像模型根据会话数据生成分享图（与 Canvas 主题解耦，由模型自由发挥视觉） */
export function buildShareImagePrompt(session: SkiSessionFormValues, locale: "zh" | "en", hasUserPhoto = false): string {
  const runs = session.runs;
  const s = computeSkiDaySummary(runs);
  const date = session.dayDate;

  if (locale === "en") {
    const lines = runs.map(
      (r, i) =>
        `Run ${i + 1}: ${r.resort.trim() || "—"} — duration ${r.duration}, distance ${fmtNum(r.distance_km, locale)} km, max ${fmtNum(r.max_speed_kmh, locale)} km/h, vertical ${r.vertical_m} m`,
    );
    const photoInstruction = hasUserPhoto
      ? `\nThe user has attached their own photo. Use it as the FULL-BLEED background of the entire image — edge to edge, no borders, no card frames, no rounded corners. The photo should fill the whole canvas. Overlay the stats directly on the photo using semi-transparent frosted/gradient strips or subtle text shadows for readability. The data should feel like a natural part of the scene, like a premium Instagram story — NOT a card or framed overlay sitting on top. No visible rectangles, boxes, or card borders around the data. Think: cinematic color grading + clean floating typography.`
      : ``;
    return `A polished social share image for skiing stats (aspect ratio similar to 9:16 or mobile story).
Use only these numbers (do not invent):
- Trip date: ${date}
- Runs that day: ${s.runCount}
- Day totals: distance ${fmtNum(s.totalDistanceKm, locale)} km, vertical ${s.totalVerticalM} m, peak max speed ${fmtNum(s.maxSpeedKmh, locale)} km/h
Details per run:
${lines.join("\n")}
Typography & layout: be creative with fonts — mix bold condensed sans-serif for hero numbers (speed, distance), thin elegant type for labels, and a rugged hand-drawn or stencil accent font for the date or resort name. Use dramatic size contrast (huge key stats, small secondary info). Numbers should feel powerful and kinetic.
Color & mood: icy blues, deep navy, crisp whites, occasional warm amber or sunset orange highlights. Think fresh powder at golden hour. Subtle snow particle or frost texture overlays are welcome.
Composition: NO card borders, NO frames, NO rounded-corner boxes — stats float naturally in the scene. Use diagonal lines, speed-blur accents, or mountain silhouette shapes to create visual energy and movement. The overall vibe is premium winter sports lifestyle — like a GoPro highlight reel poster.
No watermarks, no third-party app logos or UI screenshots.${photoInstruction}`;
  }

  const lines = runs.map(
    (r, i) =>
      `第 ${i + 1} 场：雪场 ${r.resort.trim() || "—"}，时长 ${r.duration}，距离 ${fmtNum(r.distance_km, locale)} km，最高 ${fmtNum(r.max_speed_kmh, locale)} km/h，落差 ${r.vertical_m} m`,
  );

  const photoInstruction = hasUserPhoto
    ? `\n用户已上传了一张自己的照片，请将这张照片作为整张图的全出血背景——铺满画布、边到边，不要任何边框、卡片框、圆角矩形。数据直接浮在照片上方，用半透明磨砂渐变条或文字投影保证可读性。整体效果要像高级 Instagram Story 一样自然融合，数据是场景的一部分，而不是"贴"在上面的卡片。不要出现任何可见的矩形框或卡片边框。风格：电影级调色 + 干净的浮动字体排版。`
    : `不要生成可辨认的真实人物肖像。`;

  return `请生成一张滑雪战绩分享图（竖版、适合朋友圈/小红书），画面中清晰展示以下真实数据，不要编造数字。
- 日期：${date}
- 当日滑行场数：${s.runCount}
- 当日合计：总距离 ${fmtNum(s.totalDistanceKm, locale)} km，总落差 ${s.totalVerticalM} m，当日最高速度 ${fmtNum(s.maxSpeedKmh, locale)} km/h
各场明细：
${lines.join("\n")}
字体与排版：大胆混搭——核心数字（速度、距离）用粗体窄体无衬线大字，标签用纤细优雅字体，日期或雪场名可用粗犷手写/模板印刷风格点缀。数字要有力量感和速度感，利用夸张的字号对比（关键数据超大，次要信息小巧）。
色彩与氛围：冰蓝、深海军蓝、纯净白为主，点缀暖琥珀或日落橙做高光。想象金色时刻的新雪场景。可加入细微的雪花粒子或冰霜纹理。
构图：不要卡片边框、不要矩形框、不要圆角卡片——数据自然融入画面。可用对角线、速度模糊线条或山脊剪影来营造动感和运动张力。整体气质：高端冬季运动生活方式，像 GoPro 精彩集锦海报。
不要水印；不要出现第三方 App 的 logo 或截图界面。${photoInstruction}`;
}
