-- Remove category column and index from tasks table
DROP INDEX IF EXISTS "idx_tasks_category";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "category";