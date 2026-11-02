CREATE TABLE `demo_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`organisation` text NOT NULL,
	`venue_type` text NOT NULL,
	`locations` integer NOT NULL,
	`process` text NOT NULL,
	`message` text NOT NULL,
	`plan` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `demo_requests_reference_unique` ON `demo_requests` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_demo_requests_user_created` ON `demo_requests` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `lost_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`organisation` text NOT NULL,
	`venue_type` text NOT NULL,
	`location` text NOT NULL,
	`event_date` text NOT NULL,
	`event_time` text DEFAULT '' NOT NULL,
	`description` text NOT NULL,
	`contact_mode` text NOT NULL,
	`contact_value` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`photo_key` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lost_reports_reference_unique` ON `lost_reports` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_lost_reports_user_created` ON `lost_reports` (`user_id`,`created_at`);