import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

const testEnv = vi.hoisted(() => ({ DB: undefined as unknown }));
vi.mock('cloudflare:workers', () => ({ env: testEnv }));

import {
  clearDecisions, createDecision, deleteDecision, ensureSchema, exportDecisions,
  getDecision, getDecisionImage, getDecisionImageKey, listDecisions, saveOutcome, type CreateDecisionPayload,
} from '@/db/queries';

// An in-memory SQLite adapter executes the production SQL without opening any
// local or remote D1 database. Images are stored in the same isolated database.
const sqlite = new DatabaseSync(':memory:');
class Statement {
  constructor(private sql: string, private values: SQLInputValue[] = []) {}
  bind(...values: SQLInputValue[]) { return new Statement(this.sql, values); }
  async first() { return sqlite.prepare(this.sql).get(...this.values) ?? null; }
  async all() { return { results: sqlite.prepare(this.sql).all(...this.values) }; }
  async run() { return sqlite.prepare(this.sql).run(...this.values); }
}
const payload: CreateDecisionPayload = {
  question: 'Choose a lunch', optionA: 'Rice', optionB: 'Noodles', mode: 'fast', category: 'food',
  reversible: true, recommendationIndex: 0, confidence: 75, reason: 'Test fixture',
  tradeoff: '', regretEstimate: '', finalChoiceIndex: 0, accepted: true, durationSeconds: 2, reflection: '',
  imageA: 'data:image/jpeg;base64,/9j/2Q==',
};

beforeAll(async () => {
  testEnv.DB = {
    prepare: (sql: string) => new Statement(sql),
    batch: async (statements: Statement[]) => {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  sqlite.exec('PRAGMA foreign_keys = ON');
  await ensureSchema();
  for (const id of ['alice', 'bob']) {
    sqlite.prepare('INSERT INTO auth_users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, 0, 0)')
      .run(id, id, `${id}@example.test`);
  }
});
afterAll(() => sqlite.close());
beforeEach(() => {
  sqlite.exec('DELETE FROM decisions');
});

describe('private decision ownership with real SQLite queries', () => {
  it('isolates lists, exports, record reads, outcome writes and image access', async () => {
    const alice = (await createDecision('alice', payload))!;
    const bob = (await createDecision('bob', payload))!;
    expect((await listDecisions('alice')).map((item) => item.id)).toEqual([alice.id]);
    expect((await exportDecisions('bob')).map((item) => item.id)).toEqual([bob.id]);
    expect(await getDecision(alice.id, 'bob')).toBeNull();
    expect(await getDecisionImageKey(alice.id, 'bob', 0)).toBeNull();
    expect(await getDecisionImage(alice.id, 'bob', 0)).toBeNull();
    expect(Array.from((await getDecisionImage(alice.id, 'alice', 0))!)).toEqual([255, 216, 255, 217]);
    expect(await saveOutcome(alice.id, 'bob', { rating: 'loved', satisfaction: 5, regret: 0 })).toBeNull();
    expect((await getDecision(alice.id, 'alice'))?.outcome).toBeNull();
    expect(await deleteDecision(alice.id, 'bob')).toBe(false);
    expect(await getDecision(alice.id, 'alice')).not.toBeNull();
    expect(await getDecisionImageKey(bob.id, 'bob', 0)).toContain('users/bob/');
  });

  it('round-trips all options, background, third choice and third image', async () => {
    const record = (await createDecision('alice', { ...payload,
      options: ['Rice', 'Noodles', 'Soup'], images: [null, null, payload.imageA!],
      imageA: null, context: 'Budget: 20\nOnly 30 minutes', recommendationIndex: 2, finalChoiceIndex: 2,
    }))!;
    expect(record.options).toEqual(['Rice', 'Noodles', 'Soup']);
    expect(record.context).toBe('Budget: 20\nOnly 30 minutes');
    expect(record.recommendation).toBe('Soup');
    expect(record.finalChoice).toBe('Soup');
    expect(record.images?.[2]).toContain('/images/2');
    expect(Array.from((await getDecisionImage(record.id, 'alice', 2))!)).toEqual([255, 216, 255, 217]);
    expect(await getDecisionImage(record.id, 'bob', 2)).toBeNull();
    expect((await exportDecisions('alice'))[0].options).toEqual(record.options);
  });

  it('clears one account and its images while preserving the other account', async () => {
    await createDecision('alice', payload);
    const bob = (await createDecision('bob', payload))!;
    const bobImage = (await getDecisionImageKey(bob.id, 'bob', 0))!;
    await clearDecisions('alice');
    expect(await listDecisions('alice')).toEqual([]);
    expect((await listDecisions('bob')).map((item) => item.id)).toEqual([bob.id]);
    expect(sqlite.prepare('SELECT image_key FROM decision_images').all().map((row) => row.image_key)).toEqual([bobImage]);
    await deleteDecision(bob.id, 'bob');
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM decision_images').get()?.count).toBe(0);
  });
});
