# Or v0.1 PRD

## Product statement

Or 是一个规则本地运行、个人记录按账号隔离保存的决策伙伴：帮助容易在小事与中等选择上反复纠结的人快速做决定，记录真实选择与结果，并用历史行为减少下一次决策成本。访客可以免登录体验；保存和查看个人历史需要 GitHub 登录。

## Target user

经常面对学习、工作、社交、消费和日常安排选择；知道自己大致想要什么，却会因 guilt、害怕后悔或信息过载而拖延的人。v0.1 假设为单机单用户、无需账号。

## JTBD

- 当我卡在两个选项之间时，帮我在一分钟内形成一个可执行决定。
- 当决定带有情绪负担时，只问能改变答案的问题，而不是让我写长篇分析。
- 当类似情境再次出现时，提醒我过去真正满意或后悔的选择。
- 当我回看一段时间时，让我看到自己的偏好，而不是泛泛的人格标签。

## Problem

现有 AI 容易把简单选择扩写成文章；随机选择器没有记忆；复杂决策工具启动成本太高；日记产品只记录事后感受。用户需要的是从“纠结”到“行动”再到“学习”的完整闭环。

## Core loop

Ask → Understand → Clarify when useful → Choose → Explain → Act → Remember → Review outcome → Learn → Better recommendation.

## Modes

### Fast Or

低影响、高可逆、低情绪负担。输入两个选项后 5–10 秒内给结论、一行理由、接受或覆盖。默认不追问。

### Think Or

存在 guilt、时间/社交/精力权衡。询问 1–2 个高信息量问题，输出 recommendation、confidence、why、trade-off。

### Deep Or

职业、长期财务、搬迁等高影响决定。最多 4 个问题，允许准则、权重、可逆性、机会成本和情景分析。v0.1 只做可用的简化版，不追求专业投顾或人生顾问能力。

## Functional requirements

### Decision input

- A/B 结构化输入与自然语言解析。
- 模式可自动选择，也可由用户覆盖。
- 支持每个选项一张本地图片预览与文字描述。

### Recommendation

- 统一 `AIProvider` 接口，UI 不依赖具体 Mock 实现。
- 分类、可逆性、澄清问题、置信度、后悔估计均为可测试纯逻辑。
- 推荐结合当前文本、回答、历史选择和历史 outcome。

### Memory

- 保存 Decision、Option、Recommendation、Choice、Outcome、Reflection、Pattern、Preference。
- 用户接受或覆盖推荐都记录。
- 相似主题下的满意/后悔结果改变后续推荐分数与文案。

### Journal

- 按日期浏览 Decision Card；卡片包含问题、选项、Or chose、最终选择、理由、mood。
- 可打开详情、补充 outcome、删除单条记录。

### Audio

- 默认关闭；用户手势开启；Focus / Dream / Night 三个程序化音景；偏好保存在设备。

### Voice

- Web Speech API 输入；不支持时就地提示并继续文本输入。
- Result 可用 SpeechSynthesis 朗读推荐。

### Images

- 本地图片选择、预览、移除；只保存轻量 data URL/元信息供本机 demo 使用。
- `VisionProvider` 边界预留，但 v0.1 不自动识图。

### Outcomes

- Loved it / Fine / Regretted it；可选满意度、后悔度与文字复盘。
- 更新后即时重算相关洞察。

### Insights

- 决策次数、模式分布、接受率、平均耗时、可逆决定过度思考、类别/选择/outcome 规律。
- 仅在样本量满足规则时生成陈述，样本不足显示收集进度。

## MVP scope

P0：Fast/Think、推荐、真实持久化、Diary、Outcome、历史影响推荐、可用响应式 UI。  
P1：Decision ritual、程序化卡片、声音、语音、图片、Insights。  
P2：Deep Or 的简化权重与情景提示。

## Out of scope

云同步、多人协作、账号体系、付费 API、真实 LLM、自动图片理解、专业医疗/法律/投资建议、公网部署、复杂主题系统、社交社区。

## Success criteria

1. 新用户无需 README 能完成创建 → 推荐 → 接受/覆盖 → 保存 → 在 Diary 找回。
2. 能为已保存决定提交 outcome，并看到 Insights 变化。
3. 预置测试证明相似历史 outcome 会改变未来推荐。
4. Desktop / Tablet / Mobile 核心流可用，无 dead button。
5. `pnpm dev` 与 `pnpm build` 可运行；单元测试与关键 E2E 通过。
