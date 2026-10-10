CREATE TABLE `decision_images` (
	`image_key` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`data` blob NOT NULL,
	FOREIGN KEY (`decision_id`) REFERENCES `decisions`(`id`) ON UPDATE no action ON DELETE cascade
);
