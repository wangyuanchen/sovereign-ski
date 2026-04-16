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
      ? `\nThe user has attached their own photo. Use it as the KEY visual background / hero element of the share image. Overlay the stats on top of or alongside the photo in a stylish, readable way. Keep the user's photo prominent and recognizable. Do NOT replace it with a different image.`
      : ``;
    return `A polished social share image for skiing stats (aspect ratio similar to 9:16 or mobile story).
Use only these numbers (do not invent):
- Trip date: ${date}
- Runs that day: ${s.runCount}
- Day totals: distance ${fmtNum(s.totalDistanceKm, locale)} km, vertical ${s.totalVerticalM} m, peak max speed ${fmtNum(s.maxSpeedKmh, locale)} km/h
Details per run:
${lines.join("\n")}
Style: cold alpine, snow, premium typography, no watermarks, no third-party app logos or UI screenshots.${photoInstruction}`;
  }

  const lines = runs.map(
    (r, i) =>
      `第 ${i + 1} 场：雪场 ${r.resort.trim() || "—"}，时长 ${r.duration}，距离 ${fmtNum(r.distance_km, locale)} km，最高 ${fmtNum(r.max_speed_kmh, locale)} km/h，落差 ${r.vertical_m} m`,
  );

  const photoInstruction = hasUserPhoto
    ? `\n用户已上传了一张自己的照片，请将这张照片作为分享图的核心视觉背景或主图，把数据以优雅、易读的方式叠加在照片上方或旁边。保持用户照片醒目、可辨认，不要替换成别的图。`
    : `不要生成可辨认的真实人物肖像。`;

  return `请生成一张滑雪战绩分享图（竖版、适合朋友圈/小红书），画面中清晰展示以下真实数据，不要编造数字。
- 日期：${date}
- 当日滑行场数：${s.runCount}
- 当日合计：总距离 ${fmtNum(s.totalDistanceKm, locale)} km，总落差 ${s.totalVerticalM} m，当日最高速度 ${fmtNum(s.maxSpeedKmh, locale)} km/h
各场明细：
${lines.join("\n")}
风格：冰雪运动、冷色高级感；不要水印；不要出现第三方 App 的 logo 或截图界面；${photoInstruction}`;
}
