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

## 2026-10-09 公开部署续跑

- 已创建并通过 GitHub 连接器核实公开仓库：`https://github.com/zhouhengjindu/or-decision-companion`。仓库目前为空，尚未上传代码。
- 本机 Git 尚无 GitHub 上传凭据，首次 push 在发送代码前因缺少凭据终止。已从 GitHub 官方发布页下载并校验 GitHub CLI，工具位于被忽略的 `work/2026-10-09-deployment-tools/`。
- GitHub CLI 网页验证已进入最终权限确认页，等待用户确认授权；页面列出仓库（公开和私有）、Actions 工作流、Gist 读写和组织只读权限。
- Cloudflare 网页账户已登录，但 Wrangler 仍未认证。旧版和临时运行的新版 Wrangler OAuth 均返回 `Application authorization failed`；缩减到账户/用户只读、Workers 和 D1 写入权限后仍未成功。
- 尚未新建生产 D1/R2、配置 OAuth App 或发布网站；未接触本机 D1。下一步先完成 GitHub CLI 授权并上传代码，再解决 Cloudflare 授权及生产资源配置。

## 2026-10-10 授权与上传续跑

- 用户已确认 GitHub CLI 权限，并在 Mac 上完成通行密钥验证；CLI 已成功登录 `zhouhengjindu`。
- 已定位命令行网络超时原因：系统浏览器使用现有本地代理，CLI 未继承。此次 GitHub/Cloudflare 命令显式使用系统已有代理，不修改系统代理设置。
- 代码和完整提交历史已上传到公开 GitHub 仓库，`main` 已跟踪远程分支；首次云端 CI 成功，类型检查、lint、单元测试和生产构建通过。
- 首次 Deploy 在远程迁移前因尚未配置 `CLOUDFLARE_API_TOKEN` 终止；没有执行数据库迁移或发布。
- Cloudflare 账户后台已恢复登录；Wrangler 设备授权仍遇到授权失败或页面空白，正在检查 API Token 连接方式。生产 D1/R2、OAuth App 和部署 secrets 尚未创建，网站仍未上线。
- 已通过页面核实 `Or portfolio deployment` API Token 创建成功且为 Active；创建前摘要仅限当前账户，权限为 Workers Scripts/D1/Workers R2 Storage Edit、Account Settings Read。控制工具未取得一次性 Token 内容，当前已返回凭据列表，等待确认是否保存到本机文件；不得把 Token 发到聊天或写入仓库。

### 2026-10-10 云端资源配置补记

- 用户已将 Cloudflare Token 保存到被 Git 忽略的本机文件，权限为 `600`；Wrangler 已成功连接指定账户。`CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID` 已存入目标仓库的 Actions Secrets，并只读核实了名称。
- 已新建远程 D1 `or-decision-companion`（APAC），ID `5a7cbcb7-2647-482a-9f29-ffdea41e339f`，已替换配置中的占位值。4 个 migration 全部成功，生产 decisions 为 0；未接触本机 D1。
- 已注册账户的免费 Workers 子域 `zhouhengjindu.workers.dev`；计划应用地址为 `https://or-decision-companion.zhouhengjindu.workers.dev`，目前尚未发布，不能视为可访问网站。
- R2 API 返回 `10042 Please enable R2 through the Cloudflare Dashboard`，已打开启用页，等待确认其付款信息/订阅要求；未开通订阅或创建 bucket。
- GitHub OAuth App 表单已填好名称、主页与唯一回调 `/api/auth/callback/github`，未启用通配符。等待用户确认注册及生成 Client Secret；Worker 运行 secrets 还未上传。
- 新增使用独立内存 SQLite 执行实际业务 SQL 的两账户隔离测试，覆盖列表/导出/读取/结果修改/删除/图片归属/单账户清空。45/45 tests、typecheck 通过；lint 0 error / 3 条既有图片 warning。这不是线上 OAuth 或真实 R2 验收，后两项仍待完成。
- 下一步：确认 R2 启用条件与 OAuth App 创建授权，配置生产和隔离验收资源及运行 secrets，发布并验证登录回调和图片读写后再宣布上线。

### 2026-10-10 OAuth 与验收环境补记

- 用户确认 R2 页面不要求支付方式，并确认创建 GitHub 登录应用。OAuth App 已成功注册：`https://github.com/settings/applications/3919426`，名称 `Or Decision Companion`，唯一回调为正式 Worker 的 `/api/auth/callback/github`。生成 Client Secret 时 GitHub 要求 Touch ID；已发起验证，等待用户完成。尚未取得或上传 OAuth secret。
- 已创建独立远程 D1 `or-decision-companion-staging`，ID `715ca2b9-0c37-4fca-b8de-ab26cf885712`，4 个 migration 完成；`wrangler.jsonc` 已加入 staging 环境，并使用独立数据库及预定独立 R2 bucket。
- R2 API 仍返回未启用；网页控制工具读取启用页空白，等待用户页面截图核实启用按钮/条款。不得依据“无支付方式”自动推断已启用。
- staging Worker 已由 secrets 命令创建占位实例，两个独立认证运行 secrets 已上传；尚未部署 Or 应用代码，不能作为已上线网站交付。


### 2026-10-10 免绑卡版本发布准备

- 用户确认 R2 要求绑卡且无可用银行卡，取消 R2，采用 Workers Free + D1 私有 BLOB 图片表；没有启用付费套餐或支付方式。
- GitHub OAuth App 已创建并安全保存 client secret，生产 Worker 的 4 项运行 secrets 已上传。
- 发布工具原先 `@vinext/cloudflare@1.0.0` 与 `vinext@1.0.0-beta.3` 不兼容；已将前者精确固定到 `1.0.0-beta.3`，构建和测试环境发布通过。
- 第 5 个 migration 增加图片表，已在独立 staging D1 应用；图片与决定事务写入、级联删除，每张最多 1.5 MB、每账户最多 25 MB。
- 测试地址 https://or-decision-companion-staging.zhouhengjindu.workers.dev 已部署。两个临时测试账户验证了列表隔离、跨账户记录/图片读取与删除 404、JPEG 字节读回一致、账户清空不影响其他账户、访客 401。测试账户/会话/决定均仅在 staging 创建并在 finally 清理。
- 45/45 unit tests、typecheck 通过；lint 0 error / 3 个既有图片 warning。
- 正式站点待本次代码 push 后 Actions 迁移与发布，再验收真实 OAuth 回调。不能将 staging 的合成 session 测试视为真实 GitHub OAuth 验收。


### 2026-10-10 正式站点已发布（免绑卡）

- main 提交 `48ae56e` 已通过 [CI](https://github.com/zhouhengjindu/or-decision-companion/actions/runs/38024988511) 与 [Deploy](https://github.com/zhouhengjindu/or-decision-companion/actions/runs/38024988506)，生产 D1 第 5 个 migration 已自动执行。
- 正式地址 https://or-decision-companion.zhouhengjindu.workers.dev ：首页 HTTP 200，个人 API 未登录 401，GitHub OAuth 启动 HTTP 200，授权目标 github.com 且 callback 指向本站 `/api/auth/callback/github`。
- 运行服务只绑定 D1，没有 R2，没有添加支付方式或启用付费套餐。
- staging 合成会话的两账户 HTTP 验收全部通过，临时账户/会话/决定已清理。
- 浏览器原生 AX 与截图只返回空白内容区域，内置浏览器连接超时；HTTP 返回完整页面内容。尚未获得真实 GitHub 授权回跳或用户界面完成旅程的证据。下一步需要在用户可见浏览器打开登录页并完成 GitHub 授权，再确认已登录身份与保存一条可删除测试决定。
- 收尾修正页面原有“stays on this computer”文案，避免云端保存后产生错误隐私预期；改为按账户私有、选择保存后才持久化。
