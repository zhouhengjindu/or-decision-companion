CREATE TABLE `auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_email_unique` ON `auth_users` (`email`);--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question` text NOT NULL,
	`context` text DEFAULT '' NOT NULL,
	`mode` text NOT NULL,
	`category` text NOT NULL,
	`reversible` integer NOT NULL,
	`duration_seconds` integer DEFAULT 0 NOT NULL,
	`mood` text DEFAULT 'clear' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_decisions`("id", "user_id", "question", "context", "mode", "category", "reversible", "duration_seconds", "mood", "created_at") SELECT "id", "user_id", "question", "context", "mode", "category", "reversible", "duration_seconds", "mood", "created_at" FROM `decisions`;--> statement-breakpoint
DROP TABLE `decisions`;--> statement-breakpoint
ALTER TABLE `__new_decisions` RENAME TO `decisions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_decisions_created_at` ON `decisions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_decisions_category` ON `decisions` (`category`);--> statement-breakpoint
CREATE TABLE `__new_patterns` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`evidence_count` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_patterns`("id", "user_id", "key", "value", "evidence_count", "updated_at") SELECT "id", "user_id", "key", "value", "evidence_count", "updated_at" FROM `patterns`;--> statement-breakpoint
DROP TABLE `patterns`;--> statement-breakpoint
ALTER TABLE `__new_patterns` RENAME TO `patterns`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_patterns_user_key` ON `patterns` (`user_id`,`key`);--> statement-breakpoint
CREATE TABLE `__new_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_preferences`("id", "user_id", "key", "value", "updated_at") SELECT "id", "user_id", "key", "value", "updated_at" FROM `preferences`;--> statement-breakpoint
DROP TABLE `preferences`;--> statement-breakpoint
ALTER TABLE `__new_preferences` RENAME TO `preferences`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_preferences_user_key` ON `preferences` (`user_id`,`key`);