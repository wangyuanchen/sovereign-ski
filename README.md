# sovereign-ski

滑雪战绩卡片生成器：上传 App 截图（如滑呗），用 Claude Vision 解析数据，在 Canvas 上生成 1080×1920 竖版分享图并下载 PNG。支持**中文 / English** 界面。

线上站点示例：[ski.svgn.org](https://ski.svgn.org)（若已部署）

## 功能

- 拖拽或点击上传截图（JPG / PNG / WEBP，最大 10MB）
- 服务端调用 Anthropic Claude Vision 解析滑行数据
- 解析失败时可手动填写表单（react-hook-form + zod）
- Canvas 生成冷色运动风格卡片，支持下载 PNG
- 可选：将匿名记录写入 MySQL（PlanetScale 等），便于后续统计

## 技术栈

- Next.js 14 App Router · TypeScript · pnpm
- Tailwind CSS · shadcn/ui 风格组件 · Lucide
- next-intl（中英双语）
- Anthropic API（截图解析）
- Drizzle ORM + MySQL（可选）

## 本地开发

**环境要求：** Node 20+、pnpm 9+

```bash
pnpm install
cp .env.example .env.local
```

在 `.env.local` 中配置：

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_API_KEY` | 必填，截图解析 |
| `DATABASE_URL` | 可选，匿名存储滑行记录 |
| `NEXT_PUBLIC_APP_URL` | 站点 URL（SEO / metadata） |

```bash
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。默认语言为中文；英文路径为 `/en`。

```bash
pnpm build
pnpm start
```

数据库（可选）：

```bash
pnpm db:push
```

## 目录结构（摘要）

```
app/
  [locale]/          # 多语言页面（zh / en）
  api/parse/         # POST 解析截图
  api/records/       # POST 匿名写入记录（需 DATABASE_URL）
components/          # UploadZone、CardCanvas、DataForm 等
lib/                 # 解析、画布绘制、Drizzle schema
messages/            # next-intl 文案
```

## 部署

推荐 [Vercel](https://vercel.com)：导入仓库后配置环境变量，构建命令 `pnpm build`，输出目录默认即可。

## 许可证

本项目源码采用 **[PolyForm Noncommercial 1.0.0](./LICENSE)**（[说明与全文](https://polyformproject.org/licenses/noncommercial/1.0.0/)）：**允许非商业使用**（个人学习、研究、非营利机构等场景以许可条款为准）；**未另行书面授权不得用于商业目的**。

如需商业使用、再许可或定制，请联系：**[support@svgn.org](mailto:support@svgn.org)**。

> 说明：本仓库中的第三方依赖库仍各自遵循其原有许可证（如 MIT）；仅**本仓库贡献者编写的代码与资源**适用上述 PolyForm 条款。

## 仓库

<https://github.com/wangyuanchen/sovereign-ski>
