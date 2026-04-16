import { NextResponse } from "next/server";
import { getOpenRouterClient } from "@/lib/openrouter";
import { ACCEPTED_IMAGE_TYPES, toModelDataUrl } from "@/lib/image-utils";
import { parseAssistantSkiJson } from "@/lib/parser";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

const PROMPT_ZH = `你是滑雪运动数据提取助手。请**只根据截图中的文字与数字**（可能来自滑呗等 App），提取**单次滑行记录**的统计信息。

不要猜测或编造数据。若某字段在截图中完全找不到，填 null。

只输出一个 JSON 对象，不要 Markdown，不要解释。字段与含义：
- resort: 雪场名称（字符串），无法识别则为 null
- date: 日期，格式 YYYY-MM-DD，无法识别则为 null
- duration: 时长，保留类似 "2h 30m" 的人类可读格式，无法识别则为 null
- distance_km: 滑行距离（公里，数字），无法识别则为 null
- max_speed_kmh: 最高速度（公里/小时，数字），无法识别则为 null
- vertical_m: 垂直落差（米，整数），无法识别则为 null

示例（格式参考）：
{"resort":"万龙","date":"2024-02-15","duration":"2h 30m","distance_km":18.5,"max_speed_kmh":87,"vertical_m":1200}`;

const PROMPT_EN = `You extract a single ski run from a screenshot (e.g. ski tracking apps). Use only numbers and labels visible in the image—do not guess.

If a field is not visible, use null.

Output only one JSON object—no Markdown, no explanation.

Fields:
- resort: resort name (string), or null if unknown
- date: date as YYYY-MM-DD, or null
- duration: human-readable duration like "2h 30m", or null
- distance_km: distance in km (number), or null
- max_speed_kmh: max speed in km/h (number), or null
- vertical_m: vertical drop in meters (integer), or null

Example:
{"resort":"Niseko","date":"2024-02-15","duration":"2h 30m","distance_km":18.5,"max_speed_kmh":87,"vertical_m":1200}`;

/** 解析截图专用视觉模型；未设置时使用默认 */
function resolveParseModel(): string {
  return process.env.OPENROUTER_PARSE_MODEL?.trim() || "google/gemini-2.5-flash";
}

export async function POST(req: Request) {
  const client = getOpenRouterClient();
  if (!client) {
    return NextResponse.json({ ok: false, error: "missing_api_key" }, { status: 500 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
  }

  const localeRaw = form.get("locale");
  const prompt = localeRaw === "en" ? PROMPT_EN : PROMPT_ZH;

  const type = file.type || "application/octet-stream";
  if (!ACCEPTED_IMAGE_TYPES.has(type)) {
    return NextResponse.json({ ok: false, error: "bad_type" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const { dataUrl } = await toModelDataUrl(buf, type);

  const model = resolveParseModel();

  let text = "";
  try {
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (typeof raw !== "string" || !raw.trim()) {
      return NextResponse.json({ ok: false, error: "no_text" }, { status: 502 });
    }
    text = raw;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
  }

  const parsed = parseAssistantSkiJson(text);
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 422 });
  }

  return NextResponse.json({ ok: true, data: parsed });
}
