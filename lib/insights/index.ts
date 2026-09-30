import type { DecisionCategory, DecisionMode, DecisionRecord, InsightSummary } from '@/lib/types';

export function computeInsights(history: DecisionRecord[]): InsightSummary {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const modeCounts: Record<DecisionMode, number> = { fast: 0, think: 0, deep: 0 };
  const categoryCounts: Partial<Record<DecisionCategory, number>> = {};
  let accepted = 0;
  let lovedCount = 0;
  let regrettedCount = 0;
  let outcomeCount = 0;
  let duration = 0;
  let overthoughtReversible = 0;

  history.forEach((record) => {
    modeCounts[record.mode] += 1;
    categoryCounts[record.category] = (categoryCounts[record.category] ?? 0) + 1;
    if (record.accepted) accepted += 1;
    duration += record.durationSeconds;
    if (record.reversible && record.durationSeconds > 45) overthoughtReversible += 1;
    if (record.outcome) {
      outcomeCount += 1;
      if (record.outcome.rating === 'loved') lovedCount += 1;
      if (record.outcome.rating === 'regretted') regrettedCount += 1;
    }
  });

  const statements: string[] = [];
  if (history.length >= 2) {
    const fastestHappy = history.filter((record) => record.durationSeconds <= 30 && record.outcome?.rating === 'loved').length;
    if (fastestHappy >= 2) statements.push('Your happiest decisions are often the ones you make quickly.');
    if (modeCounts.fast / history.length >= 0.55) statements.push('Most of your decisions are reversible. You rarely need the full analysis.');
    if (accepted / history.length >= 0.65) statements.push('Once you ask for a decision, you usually feel ready to follow it.');
  }
  if (outcomeCount >= 2) {
    const regretRate = regrettedCount / outcomeCount;
    if (regretRate <= 0.2) statements.push('Following through has worked more often than your uncertainty predicted.');
    if (regretRate >= 0.5) statements.push('Your recent outcomes suggest it is worth pausing on the pattern that keeps repeating.');
  }
  const social = history.filter((record) => record.category === 'social' && record.outcome);
  if (social.length >= 2) {
    const missed = social.filter((record) => /stay|skip|home|不去|留在家/i.test(record.finalChoice) && record.outcome?.rating === 'regretted').length;
    if (missed >= 1) statements.push('You regret missed social experiences more than the effort of showing up.');
  }
  if (!statements.length) statements.push('A few more outcomes will turn your decisions into a pattern Or can trust.');

  return {
    total: history.length,
    thisWeek: history.filter((record) => new Date(record.createdAt).getTime() >= weekAgo).length,
    acceptanceRate: history.length ? Math.round((accepted / history.length) * 100) : 0,
    outcomeCount,
    lovedCount,
    regrettedCount,
    averageDuration: history.length ? Math.round(duration / history.length) : 0,
    modeCounts,
    categoryCounts,
    overthoughtReversible,
    statements,
  };
}
