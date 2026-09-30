ALTER TABLE `options` RENAME COLUMN "image_data" TO "image_key";--> statement-breakpoint
ALTER TABLE `options` ADD `image_size` integer DEFAULT 0 NOT NULL;