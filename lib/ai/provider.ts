import type {
  ClarifyingQuestion,
  DecisionClassification,
  DecisionInput,
  DecisionRecord,
  InsightSummary,
  Recommendation,
  RecommendationContext,
} from '@/lib/types';

export interface AIProvider {
  classifyDecision(input: DecisionInput): Promise<DecisionClassification>;
  generateClarifyingQuestions(input: DecisionInput, classification: DecisionClassification): Promise<ClarifyingQuestion[]>;
  recommend(context: RecommendationContext): Promise<Recommendation>;
  generateReflection(record: Pick<DecisionRecord, 'finalChoice' | 'accepted' | 'mode' | 'category'>): Promise<string>;
  summarizePatterns(history: DecisionRecord[]): Promise<InsightSummary>;
}

export interface VisionProvider {
  describeOption(imageData: string): Promise<{ description: string; confidence: number }>;
}
