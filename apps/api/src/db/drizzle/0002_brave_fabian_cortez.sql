ALTER TABLE "task_categories" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "task_categories" ADD COLUMN "type" text DEFAULT 'user' NOT NULL;