# Or Design System

## Tokens

- Background `#F3EFE7`（warm paper）；surface `#FBF8F1`；ink `#282620`；muted `#777168`。
- Accent sage `#697B69`；clay `#B86F52`；line `rgba(56,51,44,.14)`。
- Display font：Iowan Old Style / Baskerville / Georgia；UI font：Avenir Next / Inter / system sans。
- Spacing 基于 4px；主页面宽度 1180px；正文阅读宽度 720px。
- Radius：10 / 16 / 24 / full；纸张卡片避免所有元素统一大圆角。
- Shadow：低对比、多层纸张阴影，不使用高饱和 glow。

## Components

- Button：ink primary、paper secondary、bare tertiary；所有状态保留 44px 触控高度。
- Input：大字号无边框纸张字段，focus 用细 sage ring。
- Mode pill：单选语义，选中使用墨色或 sage，而不是亮蓝色。
- Journal card：允许 1–2deg 轻旋转，hover 归零；内容保持水平可读。
- Confidence：文字 + 细线，不使用企业仪表盘式圆环。

## Motion

- `--ease-soft: cubic-bezier(.22,1,.36,1)`。
- Hover 160ms；section 320ms；ritual 1400ms。
- `prefers-reduced-motion` 下移除位移/旋转，仅保留即时 opacity。

## Copy voice

结论短、坚定、不命令；解释体现对人的理解但不装作治疗师。避免 “As an AI”、长 disclaimer、夸张疗愈语言和空泛激励。
