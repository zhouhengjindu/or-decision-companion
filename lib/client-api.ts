import type { DecisionRecord, OutcomeRating } from '@/lib/types';
import type { CreateDecisionPayload } from '@/db/queries';

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Something went wrong.');
  return data;
}

export async function fetchDecisions() {
  const data = await readJson<{ decisions: DecisionRecord[] }>(await fetch('/api/decisions', { cache: 'no-store' }));
  return data.decisions;
}

export async function fetchDecision(id: string) {
  const data = await readJson<{ decision: DecisionRecord }>(await fetch(`/api/decisions/${id}`, { cache: 'no-store' }));
  return data.decision;
}

export async function saveDecision(payload: CreateDecisionPayload) {
  const data = await readJson<{ decision: DecisionRecord }>(await fetch('/api/decisions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }));
  return data.decision;
}

export async function saveDecisionOutcome(
  id: string,
  payload: { rating: OutcomeRating; satisfaction: number; regret: number; reflection?: string },
) {
  const data = await readJson<{ decision: DecisionRecord }>(await fetch(`/api/decisions/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }));
  return data.decision;
}

export async function removeDecision(id: string) {
  await readJson<{ ok: boolean }>(await fetch(`/api/decisions/${id}`, { method: 'DELETE' }));
}

export async function clearAllDecisions() {
  await readJson<{ ok: boolean }>(await fetch('/api/decisions', { method: 'DELETE' }));
}
