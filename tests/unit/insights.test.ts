import { describe, expect, it } from 'vitest';
import { computeInsights } from '@/lib/insights';
import type { DecisionRecord } from '@/lib/types';

function record(id: string, overrides: Partial<DecisionRecord> = {}): DecisionRecord {
  return {
    id, question: 'Coffee or tea?', context: '', optionA: 'Coffee', optionB: 'Tea', mode: 'fast', category: 'food',
    reversible: true, recommendationIndex: 0, recommendation: 'Coffee', confidence: 72, reason: 'Done.', tradeoff: 'Tea',
    regretEstimate: 'Low', finalChoiceIndex: 0, finalChoice: 'Coffee', accepted: true, durationSeconds: 12,
    mood: 'curious', reflection: 'A quick choice.', createdAt: new Date().toISOString(), outcome: null, ...overrides,
  };
}

describe('personal insights', () => {
  it('never invents activity for an empty history', () => {
    expect(computeInsights([])).toMatchObject({ total: 0, thisWeek: 0, acceptanceRate: 0, outcomeCount: 0 });
  });

  it('computes counts and rates from real records', () => {
    const summary = computeInsights([
      record('1', { outcome: { rating: 'loved', satisfaction: 5, regret: 0 } }),
      record('2', { accepted: false, mode: 'think', durationSeconds: 60, outcome: { rating: 'fine', satisfaction: 3, regret: 1 } }),
    ]);
    expect(summary).toMatchObject({ total: 2, outcomeCount: 2, lovedCount: 1, acceptanceRate: 50, averageDuration: 36 });
  });

  it('flags reversible decisions that consumed too long', () => {
    expect(computeInsights([record('1', { durationSeconds: 80 })]).overthoughtReversible).toBe(1);
  });
});
