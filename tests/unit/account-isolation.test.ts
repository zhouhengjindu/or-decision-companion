import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

const testEnv = vi.hoisted(() => ({ DB: undefined as unknown, IMAGES: undefined as unknown }));
vi.mock('cloudflare:workers', () => ({ env: testEnv }));

import {
  clearDecisions, createDecision, deleteDecision, ensureSchema, exportDecisions,
  getDecision, getDecisionImageKey, listDecisions, saveOutcome, type CreateDecisionPayload,
} from '@/db/queries';

// An in-memory SQLite adapter executes the production SQL without opening any
// local or remote D1 database. Object storage is also confined to this test.
const sqlite = new DatabaseSync(':memory:');
class Statement {
  constructor(private sql: string, private values: SQLInputValue[] = []) {}
  bind(...values: SQLInputValue[]) { return new Statement(this.sql, values); }
  async first() { return sqlite.prepare(this.sql).get(...this.values) ?? null; }
  async all() { return { results: sqlite.prepare(this.sql).all(...this.values) }; }
  async run() { return sqlite.prepare(this.sql).run(...this.values); }
}
const objects = new Map<string, Uint8Array>();
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
  testEnv.IMAGES = {
    put: async (key: string, value: Uint8Array) => { objects.set(key, value); },
    delete: async (keys: string | string[]) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) objects.delete(key);
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
  objects.clear();
});

describe('private decision ownership with real SQLite queries', () => {
  it('isolates lists, exports, record reads, outcome writes and image access', async () => {
    const alice = (await createDecision('alice', payload))!;
    const bob = (await createDecision('bob', payload))!;
    expect((await listDecisions('alice')).map((item) => item.id)).toEqual([alice.id]);
    expect((await exportDecisions('bob')).map((item) => item.id)).toEqual([bob.id]);
    expect(await getDecision(alice.id, 'bob')).toBeNull();
    expect(await getDecisionImageKey(alice.id, 'bob', 0)).toBeNull();
    expect(await saveOutcome(alice.id, 'bob', { rating: 'loved', satisfaction: 5, regret: 0 })).toBeNull();
    expect((await getDecision(alice.id, 'alice'))?.outcome).toBeNull();
    expect(await deleteDecision(alice.id, 'bob')).toBe(false);
    expect(await getDecision(alice.id, 'alice')).not.toBeNull();
    expect(await getDecisionImageKey(bob.id, 'bob', 0)).toContain('users/bob/');
  });

  it('clears one account and its images while preserving the other account', async () => {
    await createDecision('alice', payload);
    const bob = (await createDecision('bob', payload))!;
    const bobImage = (await getDecisionImageKey(bob.id, 'bob', 0))!;
    await clearDecisions('alice');
    expect(await listDecisions('alice')).toEqual([]);
    expect((await listDecisions('bob')).map((item) => item.id)).toEqual([bob.id]);
    expect([...objects.keys()]).toEqual([bobImage]);
    await deleteDecision(bob.id, 'bob');
    expect(objects.size).toBe(0);
  });
});
