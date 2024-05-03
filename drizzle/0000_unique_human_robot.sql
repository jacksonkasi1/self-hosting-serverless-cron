CREATE TABLE `tbl_projects` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`secret_key` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `tbl_schedules` (
	`id` integer PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`name` text DEFAULT 'Untitled',
	`description` text DEFAULT 'No Description',
	`request` blob,
	`cron_expression` text NOT NULL,
	`paused` integer DEFAULT false,
	`rule_arn` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`project_id`) REFERENCES `tbl_projects`(`id`) ON UPDATE no action ON DELETE no action
);
