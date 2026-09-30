export type DecisionMode = 'fast' | 'think' | 'deep';
export type ModePreference = 'auto' | DecisionMode;
export type DecisionCategory =
  | 'daily'
  | 'food'
  | 'social'
  | 'study'
  | 'work'
  | 'purchase'
  | 'travel'
  | 'career'
  | 'wellbeing';

export type OutcomeRating = 'loved' | 'fine' | 'regretted';

export interface DecisionInput {
  optionA: string;
  optionB: string;
  context?: string;
  preferredMode?: ModePreference;
}

export interface DecisionClassification {
  mode: DecisionMode;
  category: DecisionCategory;
  reversible: boolean;
  impact: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface ClarifyingQuestion {
  id: string;
  prompt: string;
  choices: Array<{ label: string; value: string }>;
}

export interface Outcome {
  rating: OutcomeRating;
  satisfaction: number;
  regret: number;
  reflection?: string;
  createdAt?: string;
}

export interface DecisionRecord {
  id: string;
  question: string;
  context: string;
  optionA: string;
  optionB: string;
  imageA?: string | null;
  imageB?: string | null;
  mode: DecisionMode;
  category: DecisionCategory;
  reversible: boolean;
  recommendationIndex: 0 | 1;
  recommendation: string;
  confidence: number;
  reason: string;
  tradeoff: string;
  regretEstimate: string;
  finalChoiceIndex: 0 | 1;
  finalChoice: string;
  accepted: boolean;
  durationSeconds: number;
  mood: string;
  reflection: string;
  createdAt: string;
  outcome?: Outcome | null;
}

export interface RecommendationContext extends DecisionInput {
  classification: DecisionClassification;
  answers: Record<string, string>;
  history: DecisionRecord[];
}

export interface Recommendation {
  chosenIndex: 0 | 1;
  choice: string;
  confidence: number;
  reason: string;
  tradeoff: string;
  regretEstimate: string;
  memoryNote?: string;
}

export interface InsightSummary {
  total: number;
  thisWeek: number;
  acceptanceRate: number;
  outcomeCount: number;
  lovedCount: number;
  regrettedCount: number;
  averageDuration: number;
  modeCounts: Record<DecisionMode, number>;
  categoryCounts: Partial<Record<DecisionCategory, number>>;
  overthoughtReversible: number;
  statements: string[];
}
