CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`monthly_limit` real NOT NULL,
	`month` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_category_month_idx` ON `budgets` (`category`,`month`);--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`habit_id` integer NOT NULL,
	`date` text NOT NULL,
	`completed` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habit_logs_habit_date_idx` ON `habit_logs` (`habit_id`,`date`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`frequency_type` text NOT NULL,
	`target_per_week` integer,
	`color` text NOT NULL,
	`created_at` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sleep_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`bedtime` text NOT NULL,
	`wake_time` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`quality` integer NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `sleep_logs_date_idx` ON `sleep_logs` (`date`);--> statement-breakpoint
CREATE TABLE `todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`due_date` text,
	`priority` text NOT NULL,
	`tag` text,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE INDEX `todos_due_date_idx` ON `todos` (`due_date`);--> statement-breakpoint
CREATE INDEX `todos_completed_idx` ON `todos` (`completed`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`category` text NOT NULL,
	`note` text,
	`date` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category`);