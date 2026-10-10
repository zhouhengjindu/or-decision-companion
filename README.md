# Or — Decision Companion

Or 是一个个人决策伙伴：先让访客免登录体验 A/B 决策，登录后把决定、结果与反思保存在各自的私有账户中，再让相似历史影响下一次推荐。推荐由本地可复现的规则引擎生成，不调用付费模型 API。

## 启动

需要 Node.js 22.13+ 与 pnpm 11+。

```bash
pnpm install
pnpm dev
```

终端出现 Local URL 后，浏览器打开：

```text
http://localhost:3000
```

访客无需注册或 API Key 即可体验推荐。保存历史、查看 Diary 和 Insights 需要 GitHub 登录。个人记录保存在绑定到 Worker 的 D1 数据库；本机 `.wrangler/` 数据目录不会自动上传。

本地启用 GitHub 登录：复制 `.dev.vars.example` 为 `.dev.vars`，填入随机生成的 `BETTER_AUTH_SECRET` 和 GitHub OAuth 应用凭据，并将 OAuth callback 设置为 `http://localhost:3000/api/auth/callback/github`。没有这些本地变量时，访客决策仍可体验，保存时会要求登录。

如果只有 npm，也可运行：

```bash
npm install
npm run dev
```

项目锁文件以 pnpm 为准，推荐优先使用 pnpm。

## 现在可以体验什么

1. 在首页输入 A / B 两个选项，或把 `A or B` 一起说/写进第一个输入框。
2. Auto 模式会选择 Fast / Think / Deep；也可以手动指定。
3. Think / Deep 会只问少量高信息量问题，然后进入约 1.4 秒 Decision Ritual。
4. Or 给出 recommendation、confidence、理由、trade-off 和 regret check。
5. 选择 `I'll do it` 接受建议，或 `Not this time` 覆盖建议；两种结果都会保存。
6. 在 Diary 重新打开决定，填写 Loved it / Fine / Regretted it 与 reflection。
7. 再次询问相似问题时，Or 会把过往 outcome 写进推荐逻辑与解释。
8. Insights 只显示真实历史计算出的数据，不使用假的 dashboard 数字。

附加体验包括：程序化 ambient sound、Web Speech API 语音输入、SpeechSynthesis 朗读、本地图片预览、可下载 PNG Decision Card、响应式移动导航。

## 验证命令

```bash
pnpm evaluate
pnpm evaluate:e2e
pnpm evaluate:all
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

- Evaluation：20 个可追溯样本，逐项保留真实输入、history seeds、完整输出、断言与错误；当前 20 / 20 通过。报告由 runner 自动生成，不手填结果。
- 单元测试：43 条，其中 32 个标准决策分类场景；覆盖 decision engine、历史 outcome 修正与 insights。
- E2E：桌面 10 条旅程 + 移动端 11 条旅程，覆盖 Fast、Think、Accept、Override、输入拦截、Diary、Outcome、历史影响、PNG Card、图片、Ambient 偏好、Voice fallback 与移动端主操作。
- Playwright 默认复用本机 Google Chrome；当前 macOS 环境不支持下载 Playwright 自带的 Chromium，因此配置使用稳定版 Chrome channel。

## 数据与隐私

- GitHub OAuth 仅用于账号身份，不请求仓库读写权限；Better Auth 会话与个人记录分别落在 D1 的认证表和业务表。
- 所有个人记录 API 从已验证的服务端会话取得 user ID，并在读、写、更新和删除查询中检查归属；匿名请求返回 401。
- 图片在浏览器压缩后上传至D1 私有图片表；D1 同时保存图片字节、key 与大小。图片读取仍经过会话与决定归属检查。
- Settings 的清空操作只针对当前登录用户，需二次确认。
- 公开部署前不会迁移本机那条私人决定；不要把 `.dev.vars`、`.wrangler/` 或本机数据库文件加入 Git。

## Cloudflare 部署

Worker 使用 `wrangler.jsonc`，线上入口默认是免费的 `workers.dev` 子域名。GitHub Actions 的生产环境需要 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID` 两个部署 secrets；Worker 运行环境还需要 `BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、`GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET`。所有真实密钥只写入 Cloudflare Secrets / GitHub Actions Secrets，不写入仓库。

```bash
pnpm db:migrate:local
pnpm db:migrate:remote
pnpm deploy
```

`pnpm deploy` 需要 Wrangler 已登录且 Cloudflare 账户、D1 资源、OAuth 回调和运行时 secrets 已配置。提交到 `main` 后，GitHub Actions 会检查代码、应用 D1 migration 并部署 Worker。

## 项目结构

```text
app/                 routes and API handlers
components/          product UI, decision flow, journal, audio
db/                  SQLite-compatible schema and queries
drizzle/             generated SQL migration
lib/                 decision engine, Mock AI, memory/insights utilities
tests/               Vitest unit tests and Playwright E2E
docs/                research, principles, IA, architecture, decisions
evaluation/          dataset, criteria, runner, raw results and report
outputs/             delivery pointers
work/                disposable work area
references/          source inventory
```

## 当前边界

- Deep Or 是可用的简化版本，不是专业投资、医疗、法律或职业咨询。
- Voice input 依赖 Chrome/Safari 的 Web Speech 支持；不支持时会保留文本输入并显示 fallback。
- Ambient sound 受浏览器自动播放规则约束；首次必须有用户手势。刷新后会在下一次用户交互恢复已授权的声音。
- 图片只做本地预览与卡片素材，不做视觉理解。
- Vinext 目前处于 beta；部署前仍须用目标账户完成 Workers 预览和 OAuth 回调验证。
- 自定义域名需用户已有可管理的 Cloudflare 域名；没有域名时使用 `workers.dev`。

完整的产品故事见 [Or Product Book](docs/OR_PRODUCT_BOOK.md)，可追溯证据见 [Evaluation Report](evaluation/report.md)。当前状态与后续优先级见 [STATUS.md](STATUS.md)。产品定义、架构和重要取舍分别见 [PRD.md](PRD.md)、[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 与 [docs/DECISIONS.md](docs/DECISIONS.md)。
