# Or 项目协作入口

## 定位

Or 是一个个人决策伙伴作品集项目。核心闭环是：输入 2–10 个选项与背景 → Fast/Think/Deep → 明确推荐 → 接受/覆盖 → Diary → Outcome → Memory 影响下一次推荐。访客可以免登录体验，个人记录需要登录后保存。

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
- 公开版使用 Better Auth + GitHub OAuth、Cloudflare D1（含私有压缩图片）；所有个人 API 必须从服务端 session 得到 userId，并按记录归属过滤。
- 浏览器音频、语音、图片均为渐进增强，失败不得阻断文本决策闭环。

## 目录与约定

- `app/` / `components/`：页面、API 与产品交互。
- `lib/` / `db/`：决策、memory、insights 与持久化。
- `evaluation/`：dataset、criteria、runner、原始结果和报告；不要手填通过率。
- `docs/OR_PRODUCT_BOOK.md`：面向人的产品叙事；`README.md`：运行入口；`STATUS.md`：现役状态。
- `outputs/`、`work/`、`references/` 保持各自交付、临时、参考用途。
- 保持本地优先、无付费 API；经用户授权公开部署采用免费 Workers + D1；不把假数据放进 Insights。
- 决策计算保留本地确定性规则，不发送决定文本到外部模型。部署方案见 `outputs/2026-09-30-Or作品集公开部署完整方案.md`；公开仓库不得包含 `.dev.vars`、`.wrangler/`、本机数据库、用户记录或密钥。
- 任何本地 D1 都不得作为生产数据库上传。数据库迁移只对 Cloudflare 新建的远程 D1 执行，E2E 和清库命令必须使用隔离测试数据库。

## 当前状态与下一步

2026-09-30：本地体验已完成公开部署改造；43/43 unit tests 和 production build 通过，lint 0 error / 3 个既有图片 warning。迁移 SQL 已在独立内存 SQLite 执行验证，未接触本机 D1。生产上线还需：Cloudflare 身份验证及新建 D1/R2、GitHub OAuth 凭据、GitHub 公开仓库与 Actions secrets。

下一步完成账户凭据与 Cloudflare 环境配置，验证两账户数据隔离、OAuth 回调和 R2 图片读写，再推送公开 GitHub 仓库并发布 `workers.dev`。后续优先做真实用户测试、语义相似 memory 与非表格化 Deep criteria；不接入远程 AI API。

2026-10-09 续跑：已按用户授权创建公开仓库 `zhouhengjindu/or-decision-companion`，连接器已确认公开可见且当前为空。GitHub CLI 已完成设备验证码输入，停在最终权限授权页；代码上传尚未完成。Cloudflare Wrangler OAuth 在旧版和临时新版、默认和缩减权限两种情况下均返回授权失败，CLI 尚未认证。生产 D1/R2、GitHub OAuth App、运行密钥和 Actions secrets 均待配置，网站尚未上线。下一步从 GitHub CLI 权限确认继续，并排查 Cloudflare OAuth；详细证据见 `STATUS.md`。

2026-10-10：GitHub CLI 已获用户授权，代码及完整历史已上传公开仓库，首次 GitHub CI 通过。Deploy 因缺少 Cloudflare secrets 在迁移前停止，尚未上线。命令行连接需显式使用系统已有本地代理；Cloudflare 账户后台已恢复登录，设备授权仍有错误，继续检查 API Token 连接方式。详细进度以 `STATUS.md` 的最新补记为准。

2026-10-10 云端配置：Cloudflare Token 已验证、GitHub Actions 两项部署 secrets 已保存；全新远程 D1 已创建并完成 4 个 migration（业务记录 0 条），免费账户子域 `zhouhengjindu.workers.dev` 已注册。R2 尚需网页启用，OAuth App 表单待最终创建授权；Worker 尚未部署。新增独立内存 SQLite 两账户隔离测试，45/45 tests 和 typecheck 通过。继续时读取 `STATUS.md` 最新补记；本机 D1 仍不得迁移或清空。

2026-10-10 免绑卡调整：用户无法开通需要绑卡的 R2，改用 Workers Free + D1 保存结构化数据与私有 JPEG 图片，不启用 R2。GitHub OAuth 凭据已安全保存。图片单张最多 1.5 MB、每账户最多 25 MB，单库免费上限 500 MB，适用于小规模作品集。先在独立 staging D1/Worker 验证读写和隔离，再部署生产。

2026-10-10 正式发布：免绑卡版本已通过 GitHub CI 与 Deploy（38024988511 / 38024988506），正式网址 https://or-decision-companion.zhouhengjindu.workers.dev 已返回首页 200、个人 API 401，GitHub OAuth 启动接口 200 且回调地址正确。staging 两账户 HTTP 读写/图片/清空隔离已验证并清理测试数据。浏览器工具无法读取网站画面，真实 GitHub 授权回跳与人工界面验收尚待完成，不能将服务端检查写成完整用户旅程通过。

2026-10-10 多选项修复：用户反馈 Diary/Insights/Settings 点击不跳转，已复现；站内链接改原生文档导航。输入扩展为 2–10 选项、独立多行背景；追问/推荐/改选/图片/持久化/历史保留全选项并兼容 A/B。数据库现有 options 表支持多行，无新增迁移或历史数据重写。单元测试现为 48 项；线上修复验证以 STATUS 最新记录为准。

多选项版本 `ac946c0` 已上线（CI 38027312919 / Deploy 38027312858 成功）；四个主要页面 HTTP 200，新输入界面已返回。实际刷新后点击/视觉验收仍需补齐，详见 STATUS。
