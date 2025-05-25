-- Simplify tasks schema
ALTER TABLE tasks DROP COLUMN IF EXISTS description;
ALTER TABLE tasks DROP COLUMN IF EXISTS is_focus;
ALTER TABLE tasks DROP COLUMN IF EXISTS status;

-- Add completed column if it doesn't exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false;

-- Add new indexes
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Drop old indexes that are no longer needed
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_is_focus;