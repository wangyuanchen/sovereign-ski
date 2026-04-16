# sovereign-ski

Ski stats card generator — upload an app screenshot (e.g. Huaxue / Slopes) to parse your data, or fill in **multiple runs per day** manually. Preview with **preset themes** & **multi-aspect-ratio export** (local Canvas, no tokens consumed), then optionally generate an AI share image. Architecture reserves **`SportId`** for future sports. Supports **Chinese / English** UI.

Live demo: [ski.svgn.org](https://ski.svgn.org)

## Features

- Drag-and-drop or click to upload screenshots (JPG / PNG / WEBP, max 10 MB)
- Server-side multimodal model via [OpenRouter](https://openrouter.ai/) to parse **single-session** data (add more runs manually)
- Form supports **multi-run daily** summary; **themes** (Default / Night / Powder) & **export ratios** (9:16, 3:4, 1:1) rendered locally on Canvas
- Optional: generate social-media-style AI share image (`OPENROUTER_IMAGE_MODEL`)
- Optional: persist anonymous records to PostgreSQL / Neon (one row per run)
- Mobile: tap Download to save directly to Photos via Web Share API

## Tech Stack

- Next.js 14 App Router · TypeScript · pnpm
- Tailwind CSS · shadcn/ui-style components · Lucide
- next-intl (Chinese / English)
- OpenRouter (OpenAI-compatible API for screenshot parsing)
- Drizzle ORM + PostgreSQL / Neon (optional)

## Local Development

**Requirements:** Node 20+, pnpm 9+

```bash
pnpm install
cp .env.example .env.local
```

Configure `.env.local`:

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Required. [OpenRouter](https://openrouter.ai/) API Key |
| `OPENROUTER_PARSE_MODEL` | Optional. Multimodal model for screenshot parsing. Default `google/gemini-2.5-flash` |
| `OPENROUTER_IMAGE_MODEL` | Optional. Image generation model for AI share image. Default `google/gemini-2.5-flash-image` |
| `DATABASE_URL` | Optional. PostgreSQL connection string for anonymous records |
| `NEXT_PUBLIC_APP_URL` | Site URL (SEO / metadata) |

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Default locale is Chinese; English at `/en`.

```bash
pnpm build
pnpm start
```

Database (optional):

```bash
pnpm db:push
```

## Project Structure

```
app/
  [locale]/          # i18n pages (zh / en)
  api/parse/         # POST parse screenshot
  api/records/       # POST anonymous record (requires DATABASE_URL)
components/          # UploadZone, CardCanvas, DataForm, etc.
lib/                 # Parsing, canvas drawing, Drizzle schema
messages/            # next-intl translations
```

## Deployment

### Vercel

Recommended: [Vercel](https://vercel.com) — import the repo, set environment variables, build command `pnpm build`, output directory default.

## License

This project is licensed under **[PolyForm Noncommercial 1.0.0](./LICENSE)** ([details](https://polyformproject.org/licenses/noncommercial/1.0.0/)): **non-commercial use is permitted** (personal learning, research, non-profit, etc. per license terms); **commercial use requires separate written authorization**.

For commercial licensing, sub-licensing, or custom work, contact: **[support@svgn.org](mailto:support@svgn.org)**

> Note: Third-party dependencies retain their original licenses (e.g. MIT); the PolyForm terms apply only to **code and assets contributed by this repository's authors**.

## Repository

<https://github.com/wangyuanchen/sovereign-ski>

---

<details>
<summary>🇨🇳 中文说明</summary>

# sovereign-ski

滑雪战绩卡片生成器：上传 App 截图（如滑呗）解析数据，或手动填写**当日多段滑行**；预览页可选**预设主题**与**多比例导出**（本地 Canvas，不耗 token），按需再调用图像模型生成 AI 配图。架构上预留 **`SportId`**，便于以后接入其他运动。支持**中文 / English** 界面。

线上站点示例：[ski.svgn.org](https://ski.svgn.org)

## 功能

- 拖拽或点击上传截图（JPG / PNG / WEBP，最大 10 MB）
- 服务端经 [OpenRouter](https://openrouter.ai/) 调用多模态模型解析**单场**数据（多段需手动添加）
- 表单支持**当日多场**汇总；**主题**（默认 / 夜场 / 粉雪）与**导出比例**（9:16、3:4、1:1）均为本地 Canvas 渲染
- 可选：按需调用图像模型生成朋友圈风格图（`OPENROUTER_IMAGE_MODEL`）
- 可选：将匿名记录写入 PostgreSQL / Neon（每场一行，同日多场多条）
- 移动端：点击下载按钮可通过系统分享面板直接保存到相册

## 技术栈

- Next.js 14 App Router · TypeScript · pnpm
- Tailwind CSS · shadcn/ui 风格组件 · Lucide
- next-intl（中英双语）
- OpenRouter（OpenAI 兼容 API，截图解析）
- Drizzle ORM + PostgreSQL / Neon（可选）

## 本地开发

**环境要求：** Node 20+、pnpm 9+

```bash
pnpm install
cp .env.example .env.local
```

在 `.env.local` 中配置：

| 变量 | 说明 |
|------|------|
| `OPENROUTER_API_KEY` | 必填，[OpenRouter](https://openrouter.ai/) API Key |
| `OPENROUTER_PARSE_MODEL` | 可选，解析截图用多模态模型，默认 `google/gemini-2.5-flash` |
| `OPENROUTER_IMAGE_MODEL` | 可选，AI 朋友圈配图（图像生成），默认 `google/gemini-2.5-flash-image` |
| `DATABASE_URL` | 可选，PostgreSQL 连接串，匿名存储滑行记录 |
| `NEXT_PUBLIC_APP_URL` | 站点 URL（SEO / metadata） |

```bash
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。默认语言为中文；英文路径为 `/en`。

```bash
pnpm build && pnpm start
```

数据库（可选）：`pnpm db:push`

## 部署

推荐 [Vercel](https://vercel.com)：导入仓库后配置环境变量，构建命令 `pnpm build`，输出目录默认即可。

## 许可证

本项目源码采用 **[PolyForm Noncommercial 1.0.0](./LICENSE)**：**允许非商业使用**；**未另行书面授权不得用于商业目的**。

如需商业使用请联系：**[support@svgn.org](mailto:support@svgn.org)**

</details>
