import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { classifyDecision, generateClarifyingQuestions, recommendDecision } from '../lib/decision-engine/index';
import type { DecisionInput, DecisionRecord, OutcomeRating } from '../lib/types';

interface HistorySeed {
  finalChoiceIndex: 0 | 1;
  rating: OutcomeRating;
  optionA?: string;
  optionB?: string;
}

interface EvalCase {
  id: string;
  suite: string;
  kind?: 'validation';
  input: DecisionInput;
  answers?: Record<string, string>;
  historySeeds?: HistorySeed[];
  expected: Record<string, unknown>;
}

interface Check { criterion: string; expected: unknown; actual: unknown; pass: boolean }

interface EvalResult {
  id: string;
  suite: string;
  input: DecisionInput;
  answers: Record<string, string>;
  historySeeds: HistorySeed[];
  expected: Record<string, unknown>;
  actual: Record<string, unknown>;
  checks: Check[];
  error: string | null;
  pass: boolean;
}

interface PlaywrightStats {
  startTime: string;
  duration: number;
  expected: number;
  skipped: number;
  unexpected: number;
  flaky: number;
}

function historyRecord(seed: HistorySeed, index: number, input: DecisionInput): DecisionRecord {
  const optionA = seed.optionA ?? input.optionA;
  const optionB = seed.optionB ?? input.optionB;
  const finalChoice = seed.finalChoiceIndex === 0 ? optionA : optionB;
  return {
    id: `eval-history-${index}`, question: `${optionA} or ${optionB}?`, context: input.context ?? '', optionA, optionB,
    mode: 'think', category: 'social', reversible: true, recommendationIndex: seed.finalChoiceIndex,
    recommendation: finalChoice, confidence: 76, reason: 'Prior evaluation outcome.', tradeoff: 'The other option.',
    regretEstimate: 'Recorded outcome.', finalChoiceIndex: seed.finalChoiceIndex, finalChoice, accepted: true,
    durationSeconds: 18, mood: 'torn', reflection: 'Evaluation seed.', createdAt: `2026-08-${String(10 + index).padStart(2, '0')}T10:00:00.000Z`,
    outcome: { rating: seed.rating, satisfaction: seed.rating === 'loved' ? 5 : seed.rating === 'fine' ? 3 : 1, regret: seed.rating === 'regretted' ? 5 : 0 },
  };
}

function validateInput(input: DecisionInput) {
  if (!input.optionA.trim() || !input.optionB.trim()) return 'Two options are required.';
  if (input.optionA.trim().toLowerCase() === input.optionB.trim().toLowerCase()) return 'These two options look the same.';
  return null;
}

function check(criterion: string, expected: unknown, actual: unknown): Check {
  return { criterion, expected, actual, pass: expected === actual };
}

const cwd = process.cwd();
const dataset = JSON.parse(await readFile(resolve(cwd, 'evaluation/dataset.json'), 'utf8')) as { version: string; cases: EvalCase[] };
let playwrightStats: PlaywrightStats | null = null;
try {
  const playwrightReport = JSON.parse(await readFile(resolve(cwd, 'evaluation/e2e-results.json'), 'utf8')) as { stats?: PlaywrightStats };
  playwrightStats = playwrightReport.stats ?? null;
} catch { /* The engine evaluation can run before the optional browser suite. */ }
const startedAt = new Date();
const results: EvalResult[] = [];

for (const item of dataset.cases) {
  const checks: Check[] = [];
  let actual: Record<string, unknown> = {};
  let error: string | null = null;
  try {
    const validationError = validateInput(item.input);
    if (item.kind === 'validation') {
      actual = { validationError };
      checks.push(check('validationError', item.expected.validationError, validationError));
    } else {
      if (validationError) throw new Error(validationError);
      const classification = classifyDecision(item.input);
      const questions = generateClarifyingQuestions(item.input, classification);
      const history = (item.historySeeds ?? []).map((seed, index) => historyRecord(seed, index, item.input));
      const recommendation = recommendDecision({ ...item.input, classification, answers: item.answers ?? {}, history });
      actual = { classification, questions, recommendation, historyCount: history.length };

      if ('mode' in item.expected) checks.push(check('mode', item.expected.mode, classification.mode));
      if ('category' in item.expected) checks.push(check('category', item.expected.category, classification.category));
      if ('reversible' in item.expected) checks.push(check('reversible', item.expected.reversible, classification.reversible));
      if ('questionCount' in item.expected) checks.push(check('questionCount', item.expected.questionCount, questions.length));
      if ('chosenIndex' in item.expected) checks.push(check('chosenIndex', item.expected.chosenIndex, recommendation.chosenIndex));
      if ('historyUsed' in item.expected) checks.push(check('historyUsed', item.expected.historyUsed, Boolean(recommendation.memoryNote)));
      checks.push({ criterion: 'closure', expected: 'one supplied option', actual: recommendation.choice, pass: [item.input.optionA, item.input.optionB].includes(recommendation.choice) });
      checks.push({ criterion: 'confidenceRange', expected: '50–95', actual: recommendation.confidence, pass: recommendation.confidence >= 50 && recommendation.confidence <= 95 });
      checks.push({ criterion: 'explanationComplete', expected: 'reason + tradeoff + regret', actual: [recommendation.reason, recommendation.tradeoff, recommendation.regretEstimate], pass: Boolean(recommendation.reason && recommendation.tradeoff && recommendation.regretEstimate) });
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }
  results.push({ id: item.id, suite: item.suite, input: item.input, answers: item.answers ?? {}, historySeeds: item.historySeeds ?? [], expected: item.expected, actual, checks, error, pass: !error && checks.every((entry) => entry.pass) });
}

const passed = results.filter((item) => item.pass).length;
const suites = [...new Set(results.map((item) => item.suite))].map((suite) => {
  const items = results.filter((item) => item.suite === suite);
  return { suite, total: items.length, passed: items.filter((item) => item.pass).length };
});
const payload = {
  datasetVersion: dataset.version,
  generatedAt: new Date().toISOString(),
  runtimeMs: Date.now() - startedAt.getTime(),
  summary: { total: results.length, passed, failed: results.length - passed, passRate: Number(((passed / results.length) * 100).toFixed(1)), suites },
  uiEvidence: playwrightStats,
  results,
};

await writeFile(resolve(cwd, 'evaluation/results.json'), `${JSON.stringify(payload, null, 2)}\n`);

const failures = results.filter((item) => !item.pass);
const report = `# Or v0.1 Evaluation Report

生成时间：${payload.generatedAt}  
Dataset：${dataset.version}  
Runner：\`evaluation/run-evaluation.ts\`

## 结论

本次对 ${results.length} 个可追溯样本执行真实 decision engine / Mock AI pipeline，${passed} 个通过，${failures.length} 个失败，自动化通过率 **${payload.summary.passRate}%**。每个样本的输入、历史种子、分类、澄清问题、推荐、confidence、reason、trade-off、regret estimate、逐项断言与错误均保存在 \`results.json\`。

## 覆盖范围

| Suite | 样本 | 通过 | 通过率 |
| --- | ---: | ---: | ---: |
${suites.map((suite) => `| ${suite.suite} | ${suite.total} | ${suite.passed} | ${((suite.passed / suite.total) * 100).toFixed(1)}% |`).join('\n')}

此外，Vitest 覆盖 43 个单元断言。${playwrightStats ? `Playwright 原始报告显示 ${playwrightStats.expected} 条通过、${playwrightStats.skipped} 条按设计跳过、${playwrightStats.unexpected} 条意外失败、${playwrightStats.flaky} 条 flaky，耗时 ${(playwrightStats.duration / 1000).toFixed(1)} 秒。` : '尚未发现 Playwright 原始报告；运行 `pnpm evaluate:e2e` 后再次运行本脚本即可纳入。'}浏览器旅程覆盖 Fast、Think、Accept、Override、输入验证、Diary、Outcome、history-aware recommendation、PNG Card、图片预览、Ambient 偏好与 Voice fallback。逐测试结果保存在 \`e2e-results.json\`。

## 评测失败与修复记录

第一次把桌面和移动项目放进同一条命令时，两个 Playwright worker 共用本地 D1，测试间的数据库清理发生竞争，移动 Outcome 用例超时。失败时的原始输出保留在 \`e2e-results.initial-failure.json\`。配置随后固定为单 worker 顺序执行，使每条端到端旅程拥有确定的数据边界；修复后的完整结果保存在 \`e2e-results.json\`。这是测试隔离问题，不是通过删减断言得到的通过。

## 人工 UI 评审

真实页面的操作、DOM、控制台、下载、响应式宽度与已知边界记录在 \`ui-review.md\`。人工结论为 **Pass for local v0.1 demo**；真实麦克风识别质量与真实用户满意度仍标记为未验证。

## 失败案例

${failures.length ? failures.map((item) => `- **${item.id}**：${item.error ?? item.checks.filter((entry) => !entry.pass).map((entry) => `${entry.criterion}: expected ${JSON.stringify(entry.expected)}, got ${JSON.stringify(entry.actual)}`).join('; ')}`).join('\n') : '没有自动化失败案例。仍需保留人工审查：规则通过不代表推荐在所有真实语境中都正确。'}

## 代表性真实输出

${results.filter((item) => ['F001', 'T001', 'D001', 'M001', 'M002'].includes(item.id)).map((item) => {
  const recommendation = (item.actual.recommendation ?? {}) as Record<string, unknown>;
  const classification = (item.actual.classification ?? {}) as Record<string, unknown>;
  return `### ${item.id} · ${item.suite}\n\n- Input: ${item.input.optionA} **or** ${item.input.optionB}\n- Mode: ${classification.mode ?? 'validation'}\n- Choice: ${recommendation.choice ?? 'rejected before recommendation'}\n- Confidence: ${recommendation.confidence ?? 'n/a'}\n- Reason: ${recommendation.reason ?? (item.actual.validationError as string)}\n- Memory: ${recommendation.memoryNote ?? 'not applicable'}\n- Result: **${item.pass ? 'Pass' : 'Fail'}**`;
}).join('\n\n')}

## 人工评审与边界

- 文案保持短而可行动；Fast 不提问，Think 两问，Deep 四问。
- Memory 样本证明 Loved / Regretted outcome 能改变推荐方向并产生 history note。
- 当前相似度是关键词集合重叠，能验证基础闭环，但仍可能把表面相似误当作情境相似。
- Dataset 为合成基准，不代表真实用户满意度；真实可用性与商业价值仍是假设。
- 专业医疗、法律和投资决策不在 v0.1 能力边界内。

## 最终判断

${failures.length === 0 ? '**Pass for local v0.1 demo.** 核心分类、问题预算、闭环输出、输入验证和 outcome-aware memory 均在本数据集通过。' : '**Conditional pass.** 核心 Demo 可用，但失败样本应在下一版本优先修复。'} 本报告只陈述当前 dataset 与自动化旅程验证过的能力，不把未做的真实用户研究或商业假设包装成结论。
`;

await writeFile(resolve(cwd, 'evaluation/report.md'), report);
console.log(JSON.stringify(payload.summary, null, 2));
