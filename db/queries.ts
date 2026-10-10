import { env } from 'cloudflare:workers';
import type { DecisionCategory, DecisionMode, DecisionRecord, OutcomeRating } from '@/lib/types';

let schemaReady: Promise<void> | null = null;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS auth_users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, email_verified INTEGER NOT NULL DEFAULT 0,
    image TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, question TEXT NOT NULL, context TEXT NOT NULL DEFAULT '',
    mode TEXT NOT NULL, category TEXT NOT NULL, reversible INTEGER NOT NULL, duration_seconds INTEGER NOT NULL DEFAULT 0,
    mood TEXT NOT NULL DEFAULT 'clear', created_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES auth_users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS options (
    id TEXT PRIMARY KEY, decision_id TEXT NOT NULL, position INTEGER NOT NULL, label TEXT NOT NULL, image_key TEXT, image_size INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(decision_id) REFERENCES decisions(id) ON DELETE CASCADE, UNIQUE(decision_id, position)
  )`,
  `CREATE TABLE IF NOT EXISTS decision_images (
    image_key TEXT PRIMARY KEY, decision_id TEXT NOT NULL, data BLOB NOT NULL,
    FOREIGN KEY(decision_id) REFERENCES decisions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY, decision_id TEXT NOT NULL UNIQUE, option_position INTEGER NOT NULL, confidence INTEGER NOT NULL,
    reason TEXT NOT NULL, tradeoff TEXT NOT NULL, regret_estimate TEXT NOT NULL,
    FOREIGN KEY(decision_id) REFERENCES decisions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS choices (
    id TEXT PRIMARY KEY, decision_id TEXT NOT NULL UNIQUE, option_position INTEGER NOT NULL, accepted INTEGER NOT NULL,
    FOREIGN KEY(decision_id) REFERENCES decisions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS outcomes (
    id TEXT PRIMARY KEY, decision_id TEXT NOT NULL UNIQUE, rating TEXT NOT NULL, satisfaction INTEGER NOT NULL,
    regret INTEGER NOT NULL, reflection TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
    FOREIGN KEY(decision_id) REFERENCES decisions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS reflections (
    id TEXT PRIMARY KEY, decision_id TEXT NOT NULL, kind TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL,
    FOREIGN KEY(decision_id) REFERENCES decisions(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS patterns (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, evidence_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES auth_users(id), UNIQUE(user_id, key)
  )`,
  `CREATE TABLE IF NOT EXISTS preferences (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES auth_users(id), UNIQUE(user_id, key)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_decisions_user_created ON decisions(user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_decisions_category ON decisions(category)`,
  `CREATE INDEX IF NOT EXISTS idx_reflections_decision ON reflections(decision_id)`,
];

function db() {
  if (!env.DB) throw new Error('The local decision database is unavailable.');
  return env.DB;
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const database = db();
      await database.batch(schemaStatements.map((statement) => database.prepare(statement)));
      await database.prepare('PRAGMA optimize').run();
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

interface DecisionRow {
  id: string; question: string; context: string; mode: DecisionMode; category: DecisionCategory;
  reversible: number; duration_seconds: number; mood: string; created_at: string;
  option_a: string; option_b: string; image_a: string | null; image_b: string | null;
  recommendation_index: number; confidence: number; reason: string; tradeoff: string; regret_estimate: string;
  final_choice_index: number; accepted: number; reflection: string | null; outcome_rating: OutcomeRating | null;
  outcome_satisfaction: number | null; outcome_regret: number | null; outcome_reflection: string | null;
  outcome_created_at: string | null;
}

const decisionSelect = `
  SELECT d.id, d.question, d.context, d.mode, d.category, d.reversible, d.duration_seconds, d.mood, d.created_at,
    oa.label AS option_a, ob.label AS option_b, oa.image_key AS image_a, ob.image_key AS image_b,
    r.option_position AS recommendation_index, r.confidence, r.reason, r.tradeoff, r.regret_estimate,
    c.option_position AS final_choice_index, c.accepted,
    (SELECT body FROM reflections WHERE decision_id = d.id AND kind = 'decision' ORDER BY created_at DESC LIMIT 1) AS reflection,
    o.rating AS outcome_rating, o.satisfaction AS outcome_satisfaction, o.regret AS outcome_regret,
    o.reflection AS outcome_reflection, o.created_at AS outcome_created_at
  FROM decisions d
  JOIN options oa ON oa.decision_id = d.id AND oa.position = 0
  JOIN options ob ON ob.decision_id = d.id AND ob.position = 1
  JOIN recommendations r ON r.decision_id = d.id
  JOIN choices c ON c.decision_id = d.id
  LEFT JOIN outcomes o ON o.decision_id = d.id
`;

function mapRow(row: DecisionRow): DecisionRecord {
  const recommendationIndex = (row.recommendation_index === 1 ? 1 : 0) as 0 | 1;
  const finalChoiceIndex = (row.final_choice_index === 1 ? 1 : 0) as 0 | 1;
  return {
    id: row.id,
    question: row.question,
    context: row.context,
    optionA: row.option_a,
    optionB: row.option_b,
    imageA: row.image_a ? `/api/decisions/${row.id}/images/a` : null,
    imageB: row.image_b ? `/api/decisions/${row.id}/images/b` : null,
    mode: row.mode,
    category: row.category,
    reversible: Boolean(row.reversible),
    recommendationIndex,
    recommendation: recommendationIndex === 0 ? row.option_a : row.option_b,
    confidence: row.confidence,
    reason: row.reason,
    tradeoff: row.tradeoff,
    regretEstimate: row.regret_estimate,
    finalChoiceIndex,
    finalChoice: finalChoiceIndex === 0 ? row.option_a : row.option_b,
    accepted: Boolean(row.accepted),
    durationSeconds: row.duration_seconds,
    mood: row.mood,
    reflection: row.reflection ?? '',
    createdAt: row.created_at,
    outcome: row.outcome_rating ? {
      rating: row.outcome_rating,
      satisfaction: row.outcome_satisfaction ?? 3,
      regret: row.outcome_regret ?? 0,
      reflection: row.outcome_reflection ?? '',
      createdAt: row.outcome_created_at ?? undefined,
    } : null,
  };
}

export async function listDecisions(userId: string, limit = 100) {
  await ensureSchema();
  const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
  const result = await db().prepare(`${decisionSelect} WHERE d.user_id = ? ORDER BY d.created_at DESC LIMIT ?`).bind(userId, safeLimit).all<DecisionRow>();
  return result.results.map(mapRow);
}

export async function getDecision(id: string, userId: string) {
  await ensureSchema();
  const row = await db().prepare(`${decisionSelect} WHERE d.id = ? AND d.user_id = ? LIMIT 1`).bind(id, userId).first<DecisionRow>();
  return row ? mapRow(row) : null;
}

export interface CreateDecisionPayload {
  question: string; context?: string; optionA: string; optionB: string; imageA?: string | null; imageB?: string | null;
  mode: DecisionMode; category: DecisionCategory; reversible: boolean; recommendationIndex: 0 | 1;
  confidence: number; reason: string; tradeoff: string; regretEstimate: string; finalChoiceIndex: 0 | 1;
  accepted: boolean; durationSeconds: number; mood?: string; reflection: string;
}

function decodeDecisionImage(data: string | null | undefined) {
  if (!data) return null;
  if (data.length > 2_000_000) throw new Error('Each image must be smaller than 1.5 MB after compression.');
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);
  if (!match) throw new Error('Decision images must be compressed JPEG files.');
  const bytes = Uint8Array.from(atob(match[1]), (character) => character.charCodeAt(0));
  if (bytes.byteLength > 1_500_000) throw new Error('Each image must be smaller than 1.5 MB after compression.');
  return bytes;
}

export async function createDecision(userId: string, payload: CreateDecisionPayload) {
  await ensureSchema();
  const database = db();
  const ownedCount = await database.prepare('SELECT COUNT(*) AS count FROM decisions WHERE user_id = ?').bind(userId).first<{ count: number }>();
  if ((ownedCount?.count ?? 0) >= 1000) throw new Error('Your account has reached the 1,000 decision limit.');
  const decisionId = crypto.randomUUID();
  const now = new Date().toISOString();
  const images = [decodeDecisionImage(payload.imageA), decodeDecisionImage(payload.imageB)];
  const currentImageBytes = await database.prepare(`SELECT COALESCE(SUM(o.image_size), 0) AS size
    FROM options o JOIN decisions d ON d.id = o.decision_id WHERE d.user_id = ?`).bind(userId).first<{ size: number }>();
  const imageBytes = images.reduce((sum, image) => sum + (image?.byteLength ?? 0), 0);
  if ((currentImageBytes?.size ?? 0) + imageBytes > 25_000_000) throw new Error('Your account has reached the 25 MB image storage limit.');
  const imageKeys = images.map((image, index) => image ? `users/${encodeURIComponent(userId)}/decisions/${decisionId}/${index === 0 ? 'a' : 'b'}.jpg` : null);
  await database.batch([
    database.prepare(`INSERT INTO decisions
      (id, user_id, question, context, mode, category, reversible, duration_seconds, mood, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(decisionId, userId, payload.question, payload.context ?? '', payload.mode, payload.category,
        payload.reversible ? 1 : 0, payload.durationSeconds, payload.mood ?? 'clear', now),
    database.prepare('INSERT INTO options (id, decision_id, position, label, image_key, image_size) VALUES (?, ?, 0, ?, ?, ?)')
      .bind(crypto.randomUUID(), decisionId, payload.optionA, imageKeys[0], images[0]?.byteLength ?? 0),
    database.prepare('INSERT INTO options (id, decision_id, position, label, image_key, image_size) VALUES (?, ?, 1, ?, ?, ?)')
      .bind(crypto.randomUUID(), decisionId, payload.optionB, imageKeys[1], images[1]?.byteLength ?? 0),
    database.prepare(`INSERT INTO recommendations
      (id, decision_id, option_position, confidence, reason, tradeoff, regret_estimate) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), decisionId, payload.recommendationIndex, payload.confidence, payload.reason, payload.tradeoff, payload.regretEstimate),
    database.prepare('INSERT INTO choices (id, decision_id, option_position, accepted) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), decisionId, payload.finalChoiceIndex, payload.accepted ? 1 : 0),
    database.prepare('INSERT INTO reflections (id, decision_id, kind, body, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), decisionId, 'decision', payload.reflection, now),
    ...images.flatMap((image, index) => image ? [database.prepare(
      'INSERT INTO decision_images (image_key, decision_id, data) VALUES (?, ?, ?)'
    ).bind(imageKeys[index], decisionId, image)] : []),
  ]);
  return getDecision(decisionId, userId);
}

export async function getDecisionImageKey(id: string, userId: string, position: 0 | 1) {
  await ensureSchema();
  const row = await db().prepare(`SELECT o.image_key AS imageKey FROM options o
    JOIN decisions d ON d.id = o.decision_id WHERE d.id = ? AND d.user_id = ? AND o.position = ?`)
    .bind(id, userId, position).first<{ imageKey: string | null }>();
  return row?.imageKey ?? null;
}

export async function getDecisionImage(id: string, userId: string, position: 0 | 1) {
  await ensureSchema();
  const row = await db().prepare(`SELECT i.data FROM decision_images i
    JOIN options o ON o.image_key = i.image_key JOIN decisions d ON d.id = o.decision_id
    WHERE d.id = ? AND d.user_id = ? AND o.position = ?`)
    .bind(id, userId, position).first<{ data: number[] | ArrayBuffer | Uint8Array }>();
  if (!row) return null;
  return row.data instanceof ArrayBuffer ? new Uint8Array(row.data) : new Uint8Array(row.data);
}

export async function exportDecisions(userId: string) {
  return listDecisions(userId, 1000);
}

export async function saveOutcome(
  decisionId: string,
  userId: string,
  payload: { rating: OutcomeRating; satisfaction: number; regret: number; reflection?: string },
) {
  await ensureSchema();
  const now = new Date().toISOString();
  const owned = await db().prepare('SELECT id FROM decisions WHERE id = ? AND user_id = ?').bind(decisionId, userId).first();
  if (!owned) return null;
  await db().prepare(`INSERT INTO outcomes (id, decision_id, rating, satisfaction, regret, reflection, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(decision_id) DO UPDATE SET rating = excluded.rating, satisfaction = excluded.satisfaction,
    regret = excluded.regret, reflection = excluded.reflection, created_at = excluded.created_at`)
    .bind(crypto.randomUUID(), decisionId, payload.rating, payload.satisfaction, payload.regret, payload.reflection ?? '', now).run();
  return getDecision(decisionId, userId);
}

export async function deleteDecision(id: string, userId: string) {
  await ensureSchema();
  const database = db();
  const owned = await database.prepare('SELECT id FROM decisions WHERE id = ? AND user_id = ?').bind(id, userId).first();
  if (!owned) return false;
  await database.batch([
    database.prepare('DELETE FROM outcomes WHERE decision_id = ? AND EXISTS (SELECT 1 FROM decisions WHERE id = ? AND user_id = ?)').bind(id, id, userId),
    database.prepare('DELETE FROM reflections WHERE decision_id = ? AND EXISTS (SELECT 1 FROM decisions WHERE id = ? AND user_id = ?)').bind(id, id, userId),
    database.prepare('DELETE FROM choices WHERE decision_id = ? AND EXISTS (SELECT 1 FROM decisions WHERE id = ? AND user_id = ?)').bind(id, id, userId),
    database.prepare('DELETE FROM recommendations WHERE decision_id = ? AND EXISTS (SELECT 1 FROM decisions WHERE id = ? AND user_id = ?)').bind(id, id, userId),
    database.prepare('DELETE FROM options WHERE decision_id = ? AND EXISTS (SELECT 1 FROM decisions WHERE id = ? AND user_id = ?)').bind(id, id, userId),
    database.prepare('DELETE FROM decisions WHERE id = ? AND user_id = ?').bind(id, userId),
  ]);
  return true;
}

export async function clearDecisions(userId: string) {
  await ensureSchema();
  const database = db();
  await database.batch([
    database.prepare('DELETE FROM outcomes WHERE decision_id IN (SELECT id FROM decisions WHERE user_id = ?)').bind(userId),
    database.prepare('DELETE FROM reflections WHERE decision_id IN (SELECT id FROM decisions WHERE user_id = ?)').bind(userId),
    database.prepare('DELETE FROM choices WHERE decision_id IN (SELECT id FROM decisions WHERE user_id = ?)').bind(userId),
    database.prepare('DELETE FROM recommendations WHERE decision_id IN (SELECT id FROM decisions WHERE user_id = ?)').bind(userId),
    database.prepare('DELETE FROM options WHERE decision_id IN (SELECT id FROM decisions WHERE user_id = ?)').bind(userId),
    database.prepare('DELETE FROM decisions WHERE user_id = ?').bind(userId),
    database.prepare('DELETE FROM patterns WHERE user_id = ?').bind(userId),
    database.prepare('DELETE FROM preferences WHERE user_id = ?').bind(userId),
  ]);
}
