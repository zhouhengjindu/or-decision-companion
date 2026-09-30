# Or v0.1 Manual UI Review

评审时间：2026-08-24 03:36–04:14 CST  
环境：macOS、Codex In-app Browser、系统 Google Chrome、`http://localhost:3000`  
评审原则：观察真实页面、DOM、控制台、API 和响应式宽度；不以源码存在代替功能通过。

## 实测记录

| 场景 | 操作与真实观察 | 结果 |
| --- | --- | --- |
| 首页 | 默认视口打开，标题为 `Or — A quieter way to decide`；主按钮水合后 enabled；控制台 0 error | Pass |
| Think Or | 输入 Stay home / Go out，出现 2 个高信息量问题；选择 Go out 两次 | Pass |
| Decision Ritual | 第二问后出现 `weighing / Or is choosing`，A/B 围绕中心呈现，约 1.4 秒后自动结束 | Pass |
| Recommendation | 输出 `Go out with friends`、89% confidence、理由、Accept / Override / Why / Hear Or | Pass |
| Save + Diary | Accept 后出现 `It’s decided.` 与 Journal Card；Diary 可重新打开同一决定 | Pass |
| Outcome + Insights | 选择 Loved it 并保存 reflection，详情显示 outcome saved；Insights 读取 1 个真实决定与 1 个 outcome，并明确提示样本不足 | Pass |
| Ambient refresh | `Sound off → on → reload → Sound ready → on → off`；无重复播放状态或控制台错误 | Pass |
| Photo A/B | 上传本地 PNG 后 option A 出现压缩预览和 remove 按钮；移除后恢复普通输入 | Pass |
| PNG Card | 系统 Chrome 捕获下载事件，文件名匹配 `or-decision-*.png`；in-app Browser 不暴露 data-URL download event，但页面生成无报错 | Pass |
| Responsive | 桌面 `clientWidth = scrollWidth = 1295`；移动 `clientWidth = scrollWidth = 341`；修复前 ambient decoration 曾造成横向溢出，修复后消失 | Pass |
| Final local release | 首页和 `/api/decisions` 均 HTTP 200；最终测试数据清空后 database count = 0；首页 ready 且控制台 0 error | Pass |

## 人工结论

**Pass for local v0.1 demo.** 用户可以从空白首页独立完成决定、接受或覆盖、保存、回看、outcome 和后续 memory influence。视觉、动效与渐进增强能力没有阻断 P0 闭环。

## Review / 未覆盖边界

- 没有在自动化中授权真实麦克风，因此验证的是 Web Speech 不支持时的文本 fallback；实际识别质量仍依赖浏览器、系统语言与权限。
- SpeechSynthesis 的按钮与调用路径存在，但自动化无法评价声音是否悦耳。
- Dataset 与人工流程均为合成场景，不等价于真实用户满意度或商业价值验证。
- 原生 `<img>` 用于本地 data-URL preview 和 Canvas Card 输入，Lint 保留 3 个性能提示；图片已经在客户端压缩，当前适合本地 Demo，不适合作为长期图库。
