import type {
  ClarifyingQuestion,
  DecisionCategory,
  DecisionClassification,
  DecisionInput,
  DecisionMode,
  DecisionRecord,
  Recommendation,
  RecommendationContext,
} from '@/lib/types';

const keywordGroups: Array<[DecisionCategory, string[]]> = [
  ['career', ['offer', 'career', 'resign', 'quit my job', 'degree', 'university', 'move city', 'job', '工作机会', '职业', '离职', 'offer', '读博', '搬家']],
  ['travel', ['travel', 'trip', 'flight', 'hotel', 'vacation', '旅行', '航班', '酒店', '度假']],
  ['purchase', ['buy', 'purchase', 'price', 'expensive', 'subscription', 'house', 'mortgage', 'investment', '买', '购买', '价格', '贵', '投资']],
  ['food', ['dinner', 'lunch', 'breakfast', 'coffee', 'matcha', 'ramen', 'sushi', 'restaurant', 'eat', '晚饭', '午饭', '咖啡', '餐厅', '吃']],
  ['study', ['study', 'thesis', 'paper', 'exam', 'class', 'assignment', '论文', '学习', '考试', '作业']],
  ['work', ['work', 'deadline', 'meeting', 'project', 'overtime', '加班', '会议', '项目', '工作']],
  ['social', ['friend', 'party', 'date', 'go out', 'social', 'friends', '朋友', '聚会', '约会', '出去']],
  ['wellbeing', ['rest', 'sleep', 'workout', 'gym', 'health', 'walk', '休息', '睡觉', '健身', '散步', '健康']],
];

const deepKeywords = [
  'offer', 'career', 'resign', 'quit', 'university', 'degree', 'move city', 'marry', 'travel', 'trip',
  'house', 'mortgage', 'investment', '职业', '离职', '读博', '买房', '婚', '搬家', '投资', '旅行',
];
const thinkKeywords = [
  'tonight', ' friend', 'friends', 'party', 'meeting', 'deadline', 'guilt', 'study', 'work', 'rest', 'should', 'date',
  '今晚', '朋友', '聚会', '会议', '截止', '愧疚', '论文', '工作', '休息', '要不要',
];
const irreversibleKeywords = [
  'offer', 'career', 'resign', 'quit', 'marry', 'break up', 'house', 'mortgage', 'surgery', 'degree', 'university', 'move city', 'investment',
  '离职', '职业', '结婚', '分手', '买房', '手术', '退学', '搬家', '投资', '读博',
];
function normalized(input: DecisionInput) {
  return `${input.optionA} ${input.optionB} ${input.context ?? ''}`.trim().toLowerCase();
}

function containsAny(text: string, words: string[]) {
  return words.some((word) => {
    if (!/^[a-z ]+$/.test(word)) return text.includes(word);
    const escaped = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`).test(text);
  });
}

function stableUnit(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function tokens(value: string) {
  return new Set(value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1));
}

function similarity(left: string, right: string) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  a.forEach((token) => { if (b.has(token)) overlap += 1; });
  return overlap / Math.max(a.size, b.size);
}

export function classifyDecision(input: DecisionInput): DecisionClassification {
  const text = normalized(input);
  const category = keywordGroups.find(([, words]) => containsAny(text, words))?.[0] ?? 'daily';
  const irreversible = containsAny(text, irreversibleKeywords);
  let mode: DecisionMode;

  if (input.preferredMode && input.preferredMode !== 'auto') {
    mode = input.preferredMode;
  } else if (containsAny(text, deepKeywords) || irreversible) {
    mode = 'deep';
  } else if (containsAny(text, thinkKeywords) || text.length > 105) {
    mode = 'think';
  } else {
    mode = 'fast';
  }

  const reversible = !irreversible;
  const impact = mode === 'deep' ? 'high' : mode === 'think' ? 'medium' : 'low';
  const explanation = reversible && impact === 'low'
    ? "This is reversible. It doesn't deserve a long debate."
    : mode === 'deep'
      ? 'This choice has longer consequences, so a little structure will help.'
      : 'There is a real emotional trade-off here, but only a few things can change the answer.';

  return { mode, category, reversible, impact, explanation };
}

export function generateClarifyingQuestions(
  input: DecisionInput,
  classification: DecisionClassification,
): ClarifyingQuestion[] {
  if (classification.mode === 'fast') return [];

  const questions: ClarifyingQuestion[] = [
    {
      id: 'desire',
      prompt: 'If guilt disappeared for a moment, which one would you actually want?',
      choices: [
        { label: input.optionA, value: 'A' },
        { label: input.optionB, value: 'B' },
        { label: 'Honestly, neither', value: 'neutral' },
      ],
    },
    {
      id: 'regret',
      prompt: 'Tomorrow morning, which choice would you be more likely to regret missing?',
      choices: [
        { label: input.optionA, value: 'A' },
        { label: input.optionB, value: 'B' },
        { label: 'About the same', value: 'neutral' },
      ],
    },
  ];

  if (classification.mode === 'deep') {
    questions.push(
      {
        id: 'future',
        prompt: 'Six months from now, which option better fits the person you want to become?',
        choices: [
          { label: input.optionA, value: 'A' },
          { label: input.optionB, value: 'B' },
          { label: 'Still unclear', value: 'neutral' },
        ],
      },
      {
        id: 'recovery',
        prompt: 'If it goes badly, which choice is easier to recover from?',
        choices: [
          { label: input.optionA, value: 'A' },
          { label: input.optionB, value: 'B' },
          { label: 'Equally recoverable', value: 'neutral' },
        ],
      },
    );
  }

  return questions;
}

function historyEffect(input: DecisionInput, history: DecisionRecord[]) {
  const current = `${input.optionA} ${input.optionB} ${input.context ?? ''}`;
  let score = 0;
  let strongest: DecisionRecord | undefined;
  let strongestSimilarity = 0;

  history.forEach((record) => {
    if (!record.outcome) return;
    const recordText = `${record.optionA} ${record.optionB} ${record.context}`;
    const relatedness = similarity(current, recordText);
    if (relatedness < 0.16) return;

    const choiceSimilarityA = similarity(record.finalChoice, input.optionA);
    const choiceSimilarityB = similarity(record.finalChoice, input.optionB);
    const direction = choiceSimilarityB > choiceSimilarityA ? 1 : choiceSimilarityA > choiceSimilarityB ? -1 : 0;
    const outcomeWeight = record.outcome.rating === 'loved' ? 0.24 : record.outcome.rating === 'regretted' ? -0.28 : 0.06;
    score += direction * outcomeWeight * Math.min(1, relatedness * 2.8);

    if (relatedness > strongestSimilarity) {
      strongestSimilarity = relatedness;
      strongest = record;
    }
  });

  return { score: Math.max(-0.42, Math.min(0.42, score)), strongest };
}

export function recommendDecision(context: RecommendationContext): Recommendation {
  const { optionA, optionB, classification, answers, history } = context;
  const textA = optionA.toLowerCase();
  const textB = optionB.toLowerCase();
  const historySignal = historyEffect(context, history);
  let score = (stableUnit(`${optionA}|${optionB}|${context.context ?? ''}`) - 0.5) * 0.18;

  Object.values(answers).forEach((answer) => {
    if (answer === 'A') score -= 0.22;
    if (answer === 'B') score += 0.22;
  });

  const outward = ['go out', 'friend', 'trip', 'try', 'visit', 'experience', '出去', '朋友', '旅行', '尝试'];
  const retreat = ['stay home', 'skip', 'avoid', '留在家', '不去', '放弃'];
  if (containsAny(textB, outward)) score += 0.17;
  if (containsAny(textA, outward)) score -= 0.17;
  if (containsAny(textB, retreat)) score -= 0.09;
  if (containsAny(textA, retreat)) score += 0.09;

  score += historySignal.score;
  const chosenIndex: 0 | 1 = score >= 0 ? 1 : 0;
  const choice = chosenIndex === 0 ? optionA : optionB;
  const unchosen = chosenIndex === 0 ? optionB : optionA;
  const strength = Math.min(1, Math.abs(score) / 0.65);
  const baseConfidence = classification.mode === 'fast' ? 0.72 : classification.mode === 'think' ? 0.66 : 0.59;
  const confidence = Math.round(Math.min(91, Math.max(56, (baseConfidence + strength * 0.23) * 100)));

  let reason: string;
  if (historySignal.strongest?.outcome) {
    const past = historySignal.strongest;
    const pastOutcome = past.outcome!;
    const sentiment = pastOutcome.rating === 'loved' ? 'you were glad you did' : pastOutcome.rating === 'regretted' ? 'you regretted it' : 'it turned out fine';
    reason = `A similar choice ended with “${past.finalChoice},” and ${sentiment}. Your own evidence matters more than another round of guessing.`;
  } else if (classification.reversible && classification.impact === 'low') {
    reason = `Both options are workable, and this one is easy to reverse. The value now is ending the loop, not finding a perfect answer.`;
  } else if (classification.category === 'social') {
    reason = 'The stronger regret risk is the missed experience. Unfinished low-priority work is usually easier to recover than a moment that passes.';
  } else if (classification.category === 'study' || classification.category === 'work') {
    reason = 'This gives the next few hours a cleaner shape and reduces the mental cost of carrying an unfinished choice.';
  } else if (classification.mode === 'deep') {
    reason = 'It fits the future-facing signal in your answers while leaving the more manageable downside.';
  } else {
    reason = 'Your answers lean this way, and there is not enough benefit in collecting more information before acting.';
  }

  const tradeoff = `Choosing ${choice} means letting go of ${unchosen} for now.`;
  const regretEstimate = classification.reversible
    ? 'Low regret risk — you can revise this without much cost.'
    : chosenIndex === 0
      ? 'Moderate regret risk, but the downside appears more recoverable.'
      : 'Moderate uncertainty, with a better long-term fit.';
  const memoryNote = historySignal.strongest
    ? `Or found a related decision from ${new Date(historySignal.strongest.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}.`
    : undefined;

  return { chosenIndex, choice, confidence, reason, tradeoff, regretEstimate, memoryNote };
}
