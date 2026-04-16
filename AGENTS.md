# Agent 说明（本仓库）

## 应用环境变量

见根目录 **`.env.example`**。

## 多运动扩展（Sport Skin 系统）

本项目采用 **Sport Skin** 架构：结构统一、皮肤分离。所有 UI 颜色通过 CSS 变量驱动（`--accent`、`--accent-light`、`--surface`、`--on-surface`），组件层零硬编码色值，切换运动时整站自动换肤。

### 新增一项运动的步骤

1. **`lib/sports/types.ts`** — 在 `SportId` 联合类型中添加新值（如 `"surf"`）。
2. **`lib/sports/config.ts`** — 在 `SPORT_CONFIGS` 中注册：`icon`（Lucide 图标）、`particleType`（`snow` | `bubble` | `spark` | `leaf`）、`taglineEmoji`。
3. **`app/globals.css`** — 添加 `[data-sport="surf"] { --accent: ...; --surface: ...; }` 色值块。
4. **`lib/schema.ts`** — 新增该运动的表单 Zod schema 与默认值。
5. **`lib/themes/`** — 新增主题 tokens 文件（参考 `ski.ts`）。
6. **`lib/card.ts`** — 新增 `draw*Card` 画布绘制函数。
7. **`messages/zh.json`、`messages/en.json`** — 添加对应 i18n 文案与 `tagline` 键。

### 无需修改的部分

以下组件/文件 **不需要改动**，它们全部读取 CSS 变量与 `SportConfig`：

- `components/ui/button.tsx`、`input.tsx`、`card.tsx`、`label.tsx`
- `components/UploadZone.tsx`、`DataForm.tsx`、`LocaleSwitcher.tsx`
- `components/Particles.tsx`（已支持 4 种粒子类型）
- `app/globals.css` 中的 `.glass-shimmer`、`.text-gradient-accent`、滚动条等

### CSS 变量规范

变量值为 **R G B 通道**（无逗号），以兼容 Tailwind 透明度语法：

```css
[data-sport="surf"] {
  --accent: 0 201 167;       /* 主题色 */
  --accent-light: 100 230 200; /* 主题亮色 */
  --surface: 10 26 31;       /* 页面背景 */
  --on-surface: 230 250 245; /* 文字色 */
}
```

Tailwind 中使用：`bg-accent/20`、`text-on-surface`、`border-accent/40` 等。
