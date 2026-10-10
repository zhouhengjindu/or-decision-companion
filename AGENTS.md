# Or 项目协作入口

## 定位

Or 是一个个人决策伙伴作品集项目。核心闭环是：输入 A/B → Fast/Think/Deep → 明确推荐 → 接受/覆盖 → Diary → Outcome → Memory 影响下一次推荐。访客可以免登录体验，个人记录需要登录后保存。

## 启动与验证

```bash
pnpm install
pnpm dev                 # http://localhost:3000
pnpm evaluate            # 20-case decision dataset
pnpm evaluate:e2e        # writes evaluation/e2e-results.json
pnpm evaluate:all        # unit -> browser -> generated report
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Node.js 22.13+；锁文件以 pnpm 为准，npm 命令也可启动。

## 技术与数据

- React 19、TypeScript、Tailwind CSS、Framer Motion、Vinext。
- SQLite-compatible D1 + Drizzle；schema 在 `db/schema.ts`，migration 在 `drizzle/`。
- `AIProvider` 边界在 `lib/ai/provider.ts`，v0.1 使用可重复评测的 `MockAIProvider`。
- 公开版使用 Better Auth + GitHub OAuth、Cloudflare D1 和私有 R2；所有个人 API 必须从服务端 session 得到 userId，并按记录归属过滤。
- 浏览器音频、语音、图片均为渐进增强，失败不得阻断文本决策闭环。

## 目录与约定

- `app/` / `components/`：页面、API 与产品交互。
- `lib/` / `db/`：决策、memory、insights 与持久化。
- `evaluation/`：dataset、criteria、runner、原始结果和报告；不要手填通过率。
- `docs/OR_PRODUCT_BOOK.md`：面向人的产品叙事；`README.md`：运行入口；`STATUS.md`：现役状态。
- `outputs/`、`work/`、`references/` 保持各自交付、临时、参考用途。
- 保持本地优先、无付费 API、无外部生产部署；不把假数据放进 Insights。
- 决策计算保留本地确定性规则，不发送决定文本到外部模型。部署方案见 `outputs/2026-09-30-Or作品集公开部署完整方案.md`；公开仓库不得包含 `.dev.vars`、`.wrangler/`、本机数据库、用户记录或密钥。
- 任何本地 D1 都不得作为生产数据库上传。数据库迁移只对 Cloudflare 新建的远程 D1 执行，E2E 和清库命令必须使用隔离测试数据库。

## 当前状态与下一步

2026-09-30：本地体验已完成公开部署改造；43/43 unit tests 和 production build 通过，lint 0 error / 3 个既有图片 warning。迁移 SQL 已在独立内存 SQLite 执行验证，未接触本机 D1。生产上线还需：Cloudflare 身份验证及新建 D1/R2、GitHub OAuth 凭据、GitHub 公开仓库与 Actions secrets。

下一步完成账户凭据与 Cloudflare 环境配置，验证两账户数据隔离、OAuth 回调和 R2 图片读写，再推送公开 GitHub 仓库并发布 `workers.dev`。后续优先做真实用户测试、语义相似 memory 与非表格化 Deep criteria；不接入远程 AI API。

2026-10-09 续跑：已按用户授权创建公开仓库 `zhouhengjindu/or-decision-companion`，连接器已确认公开可见且当前为空。GitHub CLI 已完成设备验证码输入，停在最终权限授权页；代码上传尚未完成。Cloudflare Wrangler OAuth 在旧版和临时新版、默认和缩减权限两种情况下均返回授权失败，CLI 尚未认证。生产 D1/R2、GitHub OAuth App、运行密钥和 Actions secrets 均待配置，网站尚未上线。下一步从 GitHub CLI 权限确认继续，并排查 Cloudflare OAuth；详细证据见 `STATUS.md`。

2026-10-10：GitHub CLI 已获用户授权，代码及完整历史已上传公开仓库，首次 GitHub CI 通过。Deploy 因缺少 Cloudflare secrets 在迁移前停止，尚未上线。命令行连接需显式使用系统已有本地代理；Cloudflare 账户后台已恢复登录，设备授权仍有错误，继续检查 API Token 连接方式。详细进度以 `STATUS.md` 的最新补记为准。
