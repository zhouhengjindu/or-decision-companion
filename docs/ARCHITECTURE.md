# Architecture

## 运行形态

Or 的交互与确定性决策引擎运行在 React/TypeScript/Vinext 应用中。公开版部署到 Cloudflare Workers：Better Auth + GitHub OAuth 负责身份会话，D1 存结构化决定与结果，D1 私有图片表 存压缩图片。访客可以计算推荐，但只有已登录账户可读写持久化记录。

## 分层

- `app/`：页面、route handlers 与 server actions。
- `components/ui`：设计系统原语。
- `components/decision`：输入、问题、仪式与结果。
- `components/journal`：卡片、Diary 与详情。
- `components/audio`：单例 Web Audio 控制器。
- `lib/decision-engine`：分类、可逆性、评分、置信度、相似历史影响。
- `lib/ai`：`AIProvider`、`MockAIProvider`，未来 Provider 不进入 UI。
- `lib/memory`：记录读写和历史摘要。
- `lib/insights`：只从真实记录计算的洞察。
- `db/`：Drizzle schema 与 D1 access helper。
- `tests/`：引擎、记忆、洞察单元测试与 Playwright E2E。

## 请求流

1. 客户端提交选项与上下文。
2. decision engine 输出 mode、reversibility、category 与澄清需求。
3. MockAIProvider 使用引擎结果和压缩后的历史摘要生成 recommendation。
4. 用户接受或覆盖后，通过服务端 API 事务式保存 decision/options/recommendation/choice。
5. Diary 与 Insights 从同一数据库读取；outcome 写入后重算模式。

## 稳定接口

```ts
interface AIProvider {
  classifyDecision(input: DecisionInput): Promise<DecisionClassification>;
  generateClarifyingQuestions(context: DecisionContext): Promise<Question[]>;
  recommend(context: RecommendationContext): Promise<Recommendation>;
  generateReflection(context: ReflectionContext): Promise<string>;
  summarizePatterns(history: DecisionRecord[]): Promise<PatternSummary[]>;
}
```

## 数据与隐私

- 用户身份来自服务端验证的 Better Auth 会话；每个个人数据读写 API 都按会话 userId 限定记录归属。
- 推荐使用确定性规则和历史结果，不向外部 AI 服务发送决定文本。
- D1 图片使用私有 key；读取通过校验会话与决定归属的 API。
- `.wrangler/` 本地数据库和 `.dev.vars` 不进入 Git；生产 D1 从 Cloudflare 新建并经 migration 初始化，不导入本机私人数据。
- 音频开关和草稿属于设备 UI 偏好，可放浏览器存储；正式决定必须进 SQLite。
- 图片在浏览器压缩后存 D1 私有图片表，D1 保存图片字节、key 和大小；单账户图片上限 25 MB。

## 降级策略

- D1 初始化失败：显示可恢复错误与重试，不伪装保存成功。
- SpeechRecognition 不支持：保留输入框并提示键入。
- Web Audio 不可用：toggle 显示不可用，不影响决策。
- 图片过大：客户端压缩或拒绝并保留文字选项。
