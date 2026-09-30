import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const authUsers = sqliteTable('auth_users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const decisions = sqliteTable('decisions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => authUsers.id),
  question: text('question').notNull(),
  context: text('context').notNull().default(''),
  mode: text('mode').notNull(),
  category: text('category').notNull(),
  reversible: integer('reversible', { mode: 'boolean' }).notNull(),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  mood: text('mood').notNull().default('clear'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_decisions_created_at').on(table.createdAt),
  index('idx_decisions_user_created').on(table.userId, table.createdAt),
  index('idx_decisions_category').on(table.category),
]);

export const options = sqliteTable('options', {
  id: text('id').primaryKey(),
  decisionId: text('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  label: text('label').notNull(),
  imageKey: text('image_key'),
  imageSize: integer('image_size').notNull().default(0),
}, (table) => [uniqueIndex('idx_options_decision_position').on(table.decisionId, table.position)]);

export const recommendations = sqliteTable('recommendations', {
  id: text('id').primaryKey(),
  decisionId: text('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  optionPosition: integer('option_position').notNull(),
  confidence: integer('confidence').notNull(),
  reason: text('reason').notNull(),
  tradeoff: text('tradeoff').notNull(),
  regretEstimate: text('regret_estimate').notNull(),
}, (table) => [uniqueIndex('idx_recommendations_decision').on(table.decisionId)]);

export const choices = sqliteTable('choices', {
  id: text('id').primaryKey(),
  decisionId: text('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  optionPosition: integer('option_position').notNull(),
  accepted: integer('accepted', { mode: 'boolean' }).notNull(),
}, (table) => [uniqueIndex('idx_choices_decision').on(table.decisionId)]);

export const outcomes = sqliteTable('outcomes', {
  id: text('id').primaryKey(),
  decisionId: text('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  rating: text('rating').notNull(),
  satisfaction: integer('satisfaction').notNull(),
  regret: integer('regret').notNull(),
  reflection: text('reflection').notNull().default(''),
  createdAt: text('created_at').notNull(),
}, (table) => [uniqueIndex('idx_outcomes_decision').on(table.decisionId)]);

export const reflections = sqliteTable('reflections', {
  id: text('id').primaryKey(),
  decisionId: text('decision_id').notNull().references(() => decisions.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [index('idx_reflections_decision').on(table.decisionId)]);

export const patterns = sqliteTable('patterns', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => authUsers.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  evidenceCount: integer('evidence_count').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_patterns_user_key').on(table.userId, table.key)]);

export const preferences = sqliteTable('preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => authUsers.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [uniqueIndex('idx_preferences_user_key').on(table.userId, table.key)]);
