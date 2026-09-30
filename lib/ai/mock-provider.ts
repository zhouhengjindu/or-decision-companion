import { classifyDecision, generateClarifyingQuestions, recommendDecision } from '@/lib/decision-engine';
import { computeInsights } from '@/lib/insights';
import type { AIProvider } from './provider';

export class MockAIProvider implements AIProvider {
  async classifyDecision(input: Parameters<AIProvider['classifyDecision']>[0]) {
    return classifyDecision(input);
  }

  async generateClarifyingQuestions(...args: Parameters<AIProvider['generateClarifyingQuestions']>) {
    return generateClarifyingQuestions(...args);
  }

  async recommend(context: Parameters<AIProvider['recommend']>[0]) {
    return recommendDecision(context);
  }

  async generateReflection(record: Parameters<AIProvider['generateReflection']>[0]) {
    if (!record.accepted) return `You trusted your own pull toward ${record.finalChoice}. The override is useful evidence, not a mistake.`;
    if (record.category === 'social') return `You chose experience over the comfort of postponing today.`;
    if (record.category === 'wellbeing') return `You gave your energy a vote today.`;
    if (record.mode === 'fast') return `You didn't need more information. You needed permission to be done.`;
    if (record.mode === 'deep') return `You made room for the future without demanding certainty from it.`;
    return `You chose ${record.finalChoice} and released the other possibility for now.`;
  }

  async summarizePatterns(history: Parameters<AIProvider['summarizePatterns']>[0]) {
    return computeInsights(history);
  }
}

export const mockAI = new MockAIProvider();
