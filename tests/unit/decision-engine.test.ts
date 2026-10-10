import { describe, expect, it } from 'vitest';
import { classifyDecision, generateClarifyingQuestions, recommendDecision } from '@/lib/decision-engine';
import type { DecisionInput, DecisionRecord } from '@/lib/types';

const cases: Array<{ name: string; input: DecisionInput; mode: 'fast' | 'think' | 'deep'; category: string; reversible: boolean }> = [
  { name: 'coffee', input: { optionA: 'Coffee', optionB: 'Matcha' }, mode: 'fast', category: 'food', reversible: true },
  { name: 'dinner', input: { optionA: 'Sushi', optionB: 'Ramen' }, mode: 'fast', category: 'food', reversible: true },
  { name: 'movie', input: { optionA: 'Movie A', optionB: 'Movie B' }, mode: 'fast', category: 'daily', reversible: true },
  { name: 'clothes', input: { optionA: 'Black shirt', optionB: 'White shirt' }, mode: 'fast', category: 'daily', reversible: true },
  { name: 'restaurant', input: { optionA: 'New restaurant', optionB: 'Old favorite' }, mode: 'fast', category: 'food', reversible: true },
  { name: 'color', input: { optionA: 'Green', optionB: 'Clay color' }, mode: 'fast', category: 'daily', reversible: true },
  { name: 'breakfast', input: { optionA: 'Cook breakfast', optionB: 'Get coffee' }, mode: 'fast', category: 'food', reversible: true },
  { name: 'walk', input: { optionA: 'Take a walk', optionB: 'Read at home' }, mode: 'fast', category: 'wellbeing', reversible: true },
  { name: 'social evening', input: { optionA: 'Stay home tonight', optionB: 'Go out with friends' }, mode: 'think', category: 'social', reversible: true },
  { name: 'thesis guilt', input: { optionA: 'Write my thesis', optionB: 'Rest tonight' }, mode: 'think', category: 'study', reversible: true },
  { name: 'deadline', input: { optionA: 'Finish the deadline work', optionB: 'Sleep early' }, mode: 'think', category: 'work', reversible: true },
  { name: 'party', input: { optionA: 'Go to the party', optionB: 'Skip it' }, mode: 'think', category: 'social', reversible: true },
  { name: 'date', input: { optionA: 'Go on the date', optionB: 'Reschedule' }, mode: 'think', category: 'social', reversible: true },
  { name: 'study plan', input: { optionA: 'Study tonight', optionB: 'See a friend' }, mode: 'think', category: 'study', reversible: true },
  { name: 'work meeting', input: { optionA: 'Attend the meeting', optionB: 'Decline it' }, mode: 'think', category: 'work', reversible: true },
  { name: 'gym guilt', input: { optionA: 'Go to the gym', optionB: 'Rest because I am tired', context: 'I feel guilty' }, mode: 'think', category: 'wellbeing', reversible: true },
  { name: 'job offer', input: { optionA: 'Accept Offer A', optionB: 'Accept Offer B' }, mode: 'deep', category: 'career', reversible: false },
  { name: 'resign', input: { optionA: 'Resign from my job', optionB: 'Stay another year' }, mode: 'deep', category: 'career', reversible: false },
  { name: 'degree', input: { optionA: 'Start a new degree', optionB: 'Keep working' }, mode: 'deep', category: 'career', reversible: false },
  { name: 'move city', input: { optionA: 'Move city', optionB: 'Stay near family' }, mode: 'deep', category: 'career', reversible: false },
  { name: 'house', input: { optionA: 'Buy a house', optionB: 'Keep renting' }, mode: 'deep', category: 'purchase', reversible: false },
  { name: 'investment', input: { optionA: 'Make the investment', optionB: 'Keep cash' }, mode: 'deep', category: 'purchase', reversible: false },
  { name: 'marriage', input: { optionA: 'Marry this year', optionB: 'Wait' }, mode: 'deep', category: 'daily', reversible: false },
  { name: 'break up', input: { optionA: 'Break up', optionB: 'Try again' }, mode: 'deep', category: 'daily', reversible: false },
  { name: '买房', input: { optionA: '今年买房', optionB: '继续租房' }, mode: 'deep', category: 'purchase', reversible: false },
  { name: '离职', input: { optionA: '现在离职', optionB: '再工作半年' }, mode: 'deep', category: 'career', reversible: false },
  { name: '论文还是吃饭', input: { optionA: '今晚写论文', optionB: '和朋友出去吃饭' }, mode: 'think', category: 'food', reversible: true },
  { name: '咖啡', input: { optionA: '咖啡', optionB: '抹茶' }, mode: 'fast', category: 'food', reversible: true },
  { name: '旅行', input: { optionA: '去旅行', optionB: '留在家' }, mode: 'deep', category: 'travel', reversible: true },
  { name: '购买', input: { optionA: '购买耳机', optionB: '继续用旧的' }, mode: 'fast', category: 'purchase', reversible: true },
  { name: 'forced fast', input: { optionA: 'Accept a job offer', optionB: 'Decline it', preferredMode: 'fast' }, mode: 'fast', category: 'career', reversible: false },
  { name: 'forced deep', input: { optionA: 'Coffee', optionB: 'Tea', preferredMode: 'deep' }, mode: 'deep', category: 'food', reversible: true },
];

describe('decision classification standard cases', () => {
  it.each(cases)('$name', ({ input, mode, category, reversible }) => {
    expect(classifyDecision(input)).toMatchObject({ mode, category, reversible });
  });
});

describe('clarifying questions', () => {
  it('asks nothing for Fast Or', () => {
    const input = { optionA: 'Coffee', optionB: 'Tea' };
    expect(generateClarifyingQuestions(input, classifyDecision(input))).toHaveLength(0);
  });

  it('asks two high-information questions for Think Or', () => {
    const input = { optionA: 'Stay home tonight', optionB: 'Go out with friends' };
    expect(generateClarifyingQuestions(input, classifyDecision(input))).toHaveLength(2);
  });

  it('caps Deep Or at four questions', () => {
    const input = { optionA: 'Offer A', optionB: 'Offer B' };
    expect(generateClarifyingQuestions(input, classifyDecision(input))).toHaveLength(4);
  });
});

describe('recommendations', () => {
  const input = { optionA: 'Stay home tonight', optionB: 'Go out with friends' };
  const classification = classifyDecision(input);

  it('is deterministic for the same decision and history', () => {
    const context = { ...input, classification, answers: {}, history: [] };
    expect(recommendDecision(context)).toEqual(recommendDecision(context));
  });

  it('uses explicit clarification answers', () => {
    const result = recommendDecision({ ...input, classification, answers: { desire: 'A', regret: 'A' }, history: [] });
    expect(result.chosenIndex).toBe(0);
  });

  it('leans toward the missed social experience without contrary evidence', () => {
    const result = recommendDecision({ ...input, classification, answers: {}, history: [] });
    expect(result.choice).toBe('Go out with friends');
  });

  it('lets a loved similar outcome strengthen the same future choice', () => {
    const history = [record({ finalChoiceIndex: 1, finalChoice: 'Go out with friends', outcome: { rating: 'loved', satisfaction: 5, regret: 0 } })];
    const result = recommendDecision({ ...input, classification, answers: {}, history });
    expect(result.chosenIndex).toBe(1);
    expect(result.reason).toContain('similar choice');
    expect(result.memoryNote).toBeTruthy();
  });

  it('lets repeated regret change a future recommendation', () => {
    const regretHistory = Array.from({ length: 3 }, (_, index) => record({
      id: `regret-${index}`,
      finalChoiceIndex: 1,
      finalChoice: 'Go out with friends',
      outcome: { rating: 'regretted', satisfaction: 1, regret: 5 },
    }));
    const result = recommendDecision({ ...input, classification, answers: {}, history: regretHistory });
    expect(result.chosenIndex).toBe(0);
  });
});

function record(overrides: Partial<DecisionRecord> = {}): DecisionRecord {
  return {
    id: 'history-1', question: 'Stay home tonight or go out with friends?', context: '', optionA: 'Stay home tonight',
    optionB: 'Go out with friends', mode: 'think', category: 'social', reversible: true, recommendationIndex: 1,
    recommendation: 'Go out with friends', confidence: 78, reason: 'A similar reason', tradeoff: 'Rest',
    regretEstimate: 'Low', finalChoiceIndex: 1, finalChoice: 'Go out with friends', accepted: true,
    durationSeconds: 18, mood: 'torn', reflection: 'I chose experience.', createdAt: '2026-08-20T10:00:00.000Z', outcome: null,
    ...overrides,
  };
}

describe('multiple options and background', () => {
  const input = { optionA: 'Tea', optionB: 'Coffee', options: ['Tea', 'Coffee', 'Water'], context: 'A drink', preferredMode: 'think' as const };
  it('includes every option in questions and can recommend the third option', () => {
    const classification = classifyDecision(input);
    for (const question of generateClarifyingQuestions(input, classification)) {
      expect(question.choices).toContainEqual({ label: 'Water', value: 'C' });
    }
    const result = recommendDecision({ ...input, classification, answers: { desire: 'C', regret: 'C' }, history: [] });
    expect(result.chosenIndex).toBe(2);
    expect(result.choice).toBe('Water');
    expect(result.tradeoff).toContain('Tea');
    expect(result.tradeoff).toContain('Coffee');
  });
  it('classifies background and later options, with repeatable results', () => {
    expect(classifyDecision({ ...input, preferredMode: 'auto', context: 'Considering a career move' }).mode).toBe('deep');
    expect(classifyDecision({ ...input, preferredMode: 'auto', options: ['Tea', 'Coffee', 'Buy a house'] }).mode).toBe('deep');
    const context = { ...input, classification: classifyDecision(input), answers: {}, history: [] };
    expect(recommendDecision(context)).toEqual(recommendDecision(context));
  });
});
