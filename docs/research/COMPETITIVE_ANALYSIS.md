# Or v0.1 竞品与邻近产品分析

调研日期：2026-08-24。范围覆盖决策工具、决策日志、数字日记、情绪记录与氛围产品。结论来自公开产品页、应用商店页和开源项目页；本阶段用于产品定位，不代表对产品商业数据的审计。

## 核心判断

现有产品通常只做好三件事中的一件：帮用户“算”、帮用户“写”，或营造让用户“静下来”的环境。Or 的机会是把三者压缩成一个低摩擦闭环：当下替用户结束纠结，随后记录实际选择与结果，并在相似问题再次出现时引用过去证据。

## 20 个产品/项目扫描

| 产品或项目 | 类型 | 可借鉴 | 不应照搬 |
| --- | --- | --- | --- |
| Decision Journal App | 决策日志 | 决策—复盘—分析闭环 | 偏理性分析平台，日常选择启动成本高 |
| Decision Journal AI | AI 决策日志 | 通过对话记录依据与偏差 | 容易演变成长对话和认知偏差清单 |
| Equinor DOT | 结构化决策 | Decision Quality、多人复杂决策 | 企业/团队流程，不适合 5–10 秒决定 |
| Entscheidungsnavi | 多准则决策 | 权重、目标、方案的严谨结构 | 表格感和学习成本过高 |
| Loomio | 群体决策 | 讨论、提案、结果留痕 | 多人协作不是 Or v0.1 的目标 |
| ChoiceMap | 个人多准则选择 | 可解释的方案比较 | 评分容易制造“伪精确” |
| Decision Mentor | 个人决策 | 标准化引导流程 | 过重表单会增加决策疲劳 |
| Picker Wheel | 随机选择 | 即时、具有仪式感 | 没有记忆、解释和学习 |
| Tiny Decisions | 随机选择 | 低门槛、快速结束纠结 | 仅随机，无法处理心理负担 |
| Decide Now! | 选择轮盘 | 轻量、趣味、明确结果 | 视觉偏游戏化，不符合安静可信定位 |
| Apple Journal | 数字日记 | 本地/隐私感、情境提示、照片融入 | 记录发生过什么，不负责做决定 |
| Day One | 数字日记 | 时间线、回看、富媒体与仪式感 | 功能层级较深，写作负担较高 |
| Reflectly | AI 情绪日记 | 引导问题、情绪—洞察循环 | 容易泛心理健康化和激励话术化 |
| Stoic | 引导式日记 | 一次一个问题、日常反思节奏 | 哲学框架不是普适决策框架 |
| Daylio | 情绪追踪 | 低输入成本、统计反馈 | 标签化强，缺少决定的上下文 |
| Rosebud | AI 日记 | 从历史内容生成个人洞察 | 长文本优先，不够行动导向 |
| Endel | 氛围声音 | 声音与视觉共同塑造状态 | 个性化音景复杂度超出 v0.1 |
| Calm | 情绪空间 | 温柔节奏、低刺激动效 | 内容库模式与 Or 核心无关 |
| Portal | 沉浸式氛围 | 用声音和空间感降低焦躁 | 高质量实景素材与版权成本高 |
| Arc / Linear | 精致生产力界面 | 清晰层级、克制动效、快速反馈 | 企业工具式侧栏和数据密度不适合首页 |

## 关键公开参考

- [Decision Journal App](https://decisionjournalapp.com/)：强调记录、复盘与分析决策。
- [Decision Journal AI](https://decisionjournal.ai/)：把决策过程做成对话式日志。
- [Equinor DOT](https://github.com/equinor/dot)：面向复杂结构化决策的开源原型。
- [Apple Journal](https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments/)：活动建议、反思提示与设备端隐私。
- [Day One](https://dayoneapp.com/)：长期日记、回看、照片与多端体验。
- [Reflectly](https://apps.apple.com/us/app/reflectly-journal-ai-diary/id1241229134)：引导式问题、情绪趋势和个性化反馈。
- [Endel](https://endel.io/)：Focus / Relax / Sleep 三种目的明确的生成式音景。
- [Loomio](https://www.loomio.com/)：群体提案与决策留痕。

## Or 不做什么

- 不做开放式 AI 聊天；每次对话必须收敛到一个选择。
- 不做企业协作、投票或群体共识工具。
- 不把所有选择都改造成权重表和评分矩阵。
- 不承诺“客观最优”，而是给出对这个用户更少后悔的行动建议。
- 不做心理诊断、治疗或危机干预。
- 不追求内容库、社交分享社区或跨设备同步。

## 真正差异点

1. **Decision closure**：Fast Or 默认直接选择；可逆小事会主动阻止过度思考。
2. **Outcome-grounded memory**：记录用户实际选了什么、结果如何，而不是只保存聊天。
3. **Regret-aware personalization**：历史后悔与满意结果能够改变未来推荐及理由。
4. **Decision diary**：将决定视觉化为手账卡，而不是冷冰冰的数据库列表。
5. **Ambient ritual**：1–2 秒轻量仪式帮助用户心理上“交出决定”，但不制造等待。

## MVP 核心 Loop

输入 A/B → 系统选择 Fast / Think / Deep → 必要时只问高信息量问题 → 推荐并解释 → 用户接受或改选 → 保存 Decision Card → 结果回访 → 统计偏好与后悔模式 → 下一次推荐引用历史证据。
