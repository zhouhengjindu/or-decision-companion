# Product & Engineering Decisions

## 2026-08-24

1. **项目边界**：当前 `/Users/zhouyayun/Desktop/or` 即 Or v0.1 独立项目根目录；不再建立嵌套 `or/`。
2. **本地规则、账号隔离**：推荐计算仍使用本地确定性规则且不依赖付费 API；公开版用 GitHub OAuth、D1 与私有 R2 为用户保存记录，所有记录按服务端 session 的 userId 隔离。本机旧数据库不迁移到生产。
3. **运行时**：使用 Sites 官方脚手架提供的 Next-compatible Vinext + React + TypeScript + Tailwind。原计划 Next.js/Prisma 在兼容性冲突时可替换；本项目保留 Next API 表面，ORM 改为 Drizzle。
4. **数据库**：使用本地 D1/SQLite 兼容数据库。其本质为 SQLite 数据与 SQL migration，满足本地结构化持久化；浏览器存储只承载声音偏好和未提交草稿。
5. **视觉方向**：默认采用 Digital Journal + Ambient Companion，奶油纸张、墨色、鼠尾草/陶土点缀、编辑式 serif 标题与克制动效。
6. **首屏结构**：第一视觉只包含 “What are you deciding?”、A/B 输入和主操作；历史与洞察降至顶部轻导航。
7. **模式策略**：自动模式是默认，用户可显式覆盖；Fast 不追问，Think 最多 2 问，Deep v0.1 最多 4 问。
8. **推荐算法**：确定性基础分 + 可复现微扰 + 历史 outcome 修正。相同输入与相同历史应稳定，避免纯随机造成不可信。
9. **图片**：v0.1 只做本地预览与文字描述，不假装识图；未来通过 `VisionProvider` 扩展。
10. **声音**：不引入版权音频，使用 Web Audio 合成三种轻量氛围；默认静音且用户手势开启。
11. **语言**：产品主界面采用简洁英文以保持品牌气质；关键提示可通过直白用词确保可理解。文档默认中文。
12. **Insights 门槛**：比例可始终按真实数据展示；自然语言趋势至少 2–3 个相关样本，避免一条记录就推断人格。
13. **评测即资产**：decision dataset、逐条 engine output、Playwright 原始 JSON、首次失败、人工 UI review 与生成报告均保留在 `evaluation/`；最终 stats 必须由 runner 读取原始结果，不能手填。
14. **E2E 数据隔离**：桌面与移动项目共用单机 D1，因此固定单 worker 顺序运行；这优先于并行提速，避免测试清理互相删除记录。
15. **声音刷新**：用户开启声音后刷新，页面显示 `Sound ready`，但不在任意点击时自动播放；只在再次点击声音按钮的明确手势中恢复。
16. **演示状态**：实机截图保存在 `docs/assets/`。生产 D1 从空数据库初始化；不上传本机私人决定。
17. **公开部署**：经用户确认采用 Cloudflare Workers + D1 + 私有 R2 + GitHub Actions，先用 `workers.dev`，自定义域名另行绑定。
