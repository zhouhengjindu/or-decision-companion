# Or v0.1 Evaluation Report

生成时间：2026-08-23T20:14:57.765Z  
Dataset：or-v0.1-eval-1  
Runner：`evaluation/run-evaluation.ts`

## 结论

本次对 20 个可追溯样本执行真实 decision engine / Mock AI pipeline，20 个通过，0 个失败，自动化通过率 **100%**。每个样本的输入、历史种子、分类、澄清问题、推荐、confidence、reason、trade-off、regret estimate、逐项断言与错误均保存在 `results.json`。

## 覆盖范围

| Suite | 样本 | 通过 | 通过率 |
| --- | ---: | ---: | ---: |
| fast | 5 | 5 | 100.0% |
| think | 5 | 5 | 100.0% |
| deep | 2 | 2 | 100.0% |
| boundary | 4 | 4 | 100.0% |
| memory | 4 | 4 | 100.0% |

此外，Vitest 覆盖 43 个单元断言。Playwright 原始报告显示 21 条通过、1 条按设计跳过、0 条意外失败、0 条 flaky，耗时 87.7 秒。浏览器旅程覆盖 Fast、Think、Accept、Override、输入验证、Diary、Outcome、history-aware recommendation、PNG Card、图片预览、Ambient 偏好与 Voice fallback。逐测试结果保存在 `e2e-results.json`。

## 评测失败与修复记录

第一次把桌面和移动项目放进同一条命令时，两个 Playwright worker 共用本地 D1，测试间的数据库清理发生竞争，移动 Outcome 用例超时。失败时的原始输出保留在 `e2e-results.initial-failure.json`。配置随后固定为单 worker 顺序执行，使每条端到端旅程拥有确定的数据边界；修复后的完整结果保存在 `e2e-results.json`。这是测试隔离问题，不是通过删减断言得到的通过。

## 人工 UI 评审

真实页面的操作、DOM、控制台、下载、响应式宽度与已知边界记录在 `ui-review.md`。人工结论为 **Pass for local v0.1 demo**；真实麦克风识别质量与真实用户满意度仍标记为未验证。

## 失败案例

没有自动化失败案例。仍需保留人工审查：规则通过不代表推荐在所有真实语境中都正确。

## 代表性真实输出

### F001 · fast

- Input: Coffee **or** Matcha
- Mode: fast
- Choice: Coffee
- Confidence: 72
- Reason: Both options are workable, and this one is easy to reverse. The value now is ending the loop, not finding a perfect answer.
- Memory: not applicable
- Result: **Pass**

### T001 · think

- Input: Stay home tonight **or** Go out with friends
- Mode: think
- Choice: Go out with friends
- Confidence: 89
- Reason: The stronger regret risk is the missed experience. Unfinished low-priority work is usually easier to recover than a moment that passes.
- Memory: not applicable
- Result: **Pass**

### D001 · deep

- Input: Accept Offer A **or** Accept Offer B
- Mode: deep
- Choice: Accept Offer A
- Confidence: 68
- Reason: It fits the future-facing signal in your answers while leaving the more manageable downside.
- Memory: not applicable
- Result: **Pass**

### M001 · memory

- Input: Stay home tonight **or** Go out with friends
- Mode: think
- Choice: Go out with friends
- Confidence: 83
- Reason: A similar choice ended with “Go out with friends,” and you were glad you did. Your own evidence matters more than another round of guessing.
- Memory: Or found a related decision from Aug 10.
- Result: **Pass**

### M002 · memory

- Input: Stay home tonight **or** Go out with friends
- Mode: think
- Choice: Stay home tonight
- Confidence: 72
- Reason: A similar choice ended with “Go out with friends,” and you regretted it. Your own evidence matters more than another round of guessing.
- Memory: Or found a related decision from Aug 10.
- Result: **Pass**

## 人工评审与边界

- 文案保持短而可行动；Fast 不提问，Think 两问，Deep 四问。
- Memory 样本证明 Loved / Regretted outcome 能改变推荐方向并产生 history note。
- 当前相似度是关键词集合重叠，能验证基础闭环，但仍可能把表面相似误当作情境相似。
- Dataset 为合成基准，不代表真实用户满意度；真实可用性与商业价值仍是假设。
- 专业医疗、法律和投资决策不在 v0.1 能力边界内。

## 最终判断

**Pass for local v0.1 demo.** 核心分类、问题预算、闭环输出、输入验证和 outcome-aware memory 均在本数据集通过。 本报告只陈述当前 dataset 与自动化旅程验证过的能力，不把未做的真实用户研究或商业假设包装成结论。
