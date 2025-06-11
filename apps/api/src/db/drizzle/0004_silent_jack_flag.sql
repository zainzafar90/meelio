ALTER TABLE "user_background_views" RENAME COLUMN "is_selected" TO "is_favourite";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "status" TO "completed";--> statement-breakpoint
DROP INDEX "idx_tasks_status";--> statement-breakpoint
DROP INDEX "idx_tasks_is_focus";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "settings" jsonb DEFAULT '{"pomodoro":{"workDuration":25,"breakDuration":5,"autoStart":false,"autoBlock":false,"soundOn":true,"dailyFocusLimit":120}}'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_tasks_completed" ON "tasks" USING btree ("completed");--> statement-breakpoint
ALTER TABLE "backgrounds" DROP COLUMN "is_default";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "is_focus";