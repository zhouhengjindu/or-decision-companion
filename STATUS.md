# Or v0.1 Status

更新时间：2026-09-30

## 交付状态

核心本地 Demo 已完成并通过桌面与移动端自动化核心流程。开发服务器为 `http://localhost:3000`；生产构建通过。

## 已完成

- Home A/B 输入、自然语言 `or` 拆分、模式自动分类与手动覆盖。
- Fast Or、Think Or、简化 Deep Or。
- 高信息量澄清问题、Decision Ritual、明确 recommendation、confidence、why、trade-off、regret check。
- Accept / Override 与真实数据库保存。
- SQLite-compatible D1 + Drizzle schema/migration；9 个实体表。
- Decision Diary、详情页、Outcome feedback、reflection。
- 相似历史 outcome 影响未来 recommendation，并显示历史提示。
- 真实历史 Personal Insights 与 Decision Budget。
- Ambient audio、语音输入 fallback、语音朗读、图片 preview、程序化 PNG Decision Card。
- 响应式桌面/平板/移动布局、键盘 focus、reduced-motion 基线。
- 43 个单元测试；桌面 10 条、移动端 11 条 E2E 旅程通过。
- 完整 Evaluation Pipeline：20 个样本、逐条真实结果、自动报告，当前 20 / 20 通过。
- 研究、PRD、架构、决策日志、UX 与设计系统文档。
- `docs/OR_PRODUCT_BOOK.md` 与 6 张真实运行截图，完整覆盖调研、产品、实现、评测、迭代、用户故事与商业化假设。

## 部分完成 / 有意简化

- Deep Or 只有四个定性问题，没有复杂 criteria weighting 或 scenario matrix。
- Personal Decision Model 使用规则、统计与相似度，不使用 ML/LLM。
- 图片没有视觉理解；只作为选项和 Journal Card 素材。
- Ambient sound 为三种简单 Web Audio 合成音景，不是自适应生成音乐系统。

## 已知问题

- 页面首次水合前极快输入可能被 React 初始状态覆盖；主按钮在水合完成前会禁用，普通用户交互不受影响，E2E 会等待可用状态。
- Web Speech API 的语言识别和权限提示取决于浏览器/操作系统。
- 图片以压缩 data URL 保存，适合本地 Demo；大量高分辨率图片不适合作为长期图库。
- 本机 Playwright 自带 Chromium 下载不支持当前 macOS target，测试配置复用已安装的 Google Chrome。

## 最终验证证据

- `pnpm evaluate`：20 / 20 通过，逐样本输出见 `evaluation/results.json`。
- `pnpm evaluate:e2e`：21 条通过、1 条桌面 project 中的移动专属检查按设计跳过；原始结果见 `evaluation/e2e-results.json`。
- 人工 UI 评审：11 个真实页面/交互场景通过，未覆盖边界见 `evaluation/ui-review.md`。
- `pnpm test`：43 / 43 通过。
- `pnpm typecheck`：通过。
- `pnpm lint`：0 error；3 个 `no-img-element` warning，来自有意使用原生 `<img>` 的用户 data-URL preview / Canvas Card 输入。
- `pnpm build`：2026-08-24 04:13 CST 通过，7 条页面/API 路由成功产出。
- 浏览器人工 QA：Fast、Think、Ritual、Accept、Diary、Outcome、Insights、Ambient、图片与 Card 均完成；控制台无错误，桌面/移动均无横向溢出。

## 继续开发的最高优先级

1. 为本地图片改用独立 blob 文件存储，数据库只保存 metadata/path。
2. 增加更明确的相似决策匹配解释与可视化证据。
3. 扩展 Deep Or 的可编辑 criteria/weights，同时保持非表格化 UI。
4. 补充真实用户可用性测试，再决定是否引入远程 AI Provider。

## 2026-09-28 项目审阅补记

- 已新增零基础 [项目全景说明书](outputs/2026-09-28-Or项目全景说明书.md) 与 [精进及开放访问方案](outputs/2026-09-28-Or精进与开放访问方案.md)。方案只供讨论，本次未实施账号、部署或推荐逻辑改造。
- 本机重新验证：`pnpm typecheck` 通过、`pnpm lint` 0 error / 3 warning、`pnpm test` 43/43 通过、`pnpm build` 通过。2026-08-24 的 20/20 evaluation 与 21 条 E2E 通过仍是历史记录，本次没有重跑。
- 只读检查发现本地 D1 现有 1 条决定、0 条 outcome。现有 E2E 会清理同一个数据库，因此本次未运行，后续应先隔离测试库。
- 公开访问前的首要阻断项：固定 `local-user`、API 无身份验证、查询/更新/删除无用户归属约束。产品价值方面，需真实用户测试与 outcome 证据，再决定是否扩展语义记忆或远程 AI。
- 当前目录没有 `.git/`，且 `.gitignore` 排除了 `outputs/`；后续如要版本化或迁移交付物，需明确版本控制和备份安排。

## 2026-09-30 公开部署执行进度

用户确认按 [公开部署方案](outputs/2026-09-30-Or作品集公开部署完整方案.md) 执行：公开 GitHub 仓库、访客免登录体验、GitHub 登录后保存、Cloudflare Workers + D1 + 私有 R2、先使用 `workers.dev`。本机旧 D1 中的 1 条记录继续留在本机。

已完成代码改造：

- 移除 Auth.js，采用 Better Auth；登录使用 GitHub OAuth。
- 决策列表、详情、修改、删除、清空、导出和账户删除 API 全部要求服务端 session，并按用户 ID 限定记录。
- 加入匿名体验、登录入口和登录后续存待保存决定；Diary、Insights 只对登录账户返回数据。
- 图片经浏览器压缩后进私有 R2；图片 API 按会话和决定归属校验，单用户累计上限 25 MB。
- 新增隐私页、账户导出/删除接口、Cloudflare Wrangler 配置、CI/Deploy Actions 和密钥模板。
- 更新产品架构说明。未将本机数据库、输出文件、`.wrangler/` 或 `.dev.vars` 推送。

已验证：`pnpm typecheck` 通过；43/43 单元测试通过；`pnpm lint` 0 error / 3 条既有 `<img>` warning；`pnpm build` 通过；3 个 D1 migration 在内存 SQLite 空库成功执行。未运行原项目 E2E，因为它会清理本地 D1；尚需为新配置单独建立隔离测试库再验证鉴权旅程。

本地 Git 已初始化，`main` 的初始提交为 `98d2516`；提交包含 93 个文件，工作区干净，`origin` 指向 `https://github.com/zhouhengjindu/or-decision-companion.git`。未包含本地 D1、真实密钥或 `outputs/`。

账号侧核验：GitHub 连接器已认证为 `zhouhengjindu`，但目标仓库返回 404；本机 Chrome 需要手动解锁才能继续浏览器操作。Cloudflare Wrangler 登录曾启动，但授权回调超时，`wrangler whoami` 仍显示未认证。需解锁后重新完成 Cloudflare CLI 登录，并创建 GitHub 仓库；再新建 D1/R2、替换真实数据库 ID、创建 GitHub OAuth App、配置 Worker 运行密钥和 GitHub Actions 部署 secrets。当前没有自定义域名，因此计划先用 `workers.dev`。
