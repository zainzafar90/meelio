-- Add composite indexes for soft delete queries to improve performance

-- Site Blockers index
CREATE INDEX IF NOT EXISTS idx_site_blockers_user_deleted 
ON site_blockers(user_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Tab Stashes index
CREATE INDEX IF NOT EXISTS idx_tab_stashes_user_deleted 
ON tab_stashes(user_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Tasks index
CREATE INDEX IF NOT EXISTS idx_tasks_user_deleted 
ON tasks(user_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Add index for updatedAt to support LWW merge operations
CREATE INDEX IF NOT EXISTS idx_site_blockers_updated 
ON site_blockers(updated_at);

CREATE INDEX IF NOT EXISTS idx_tab_stashes_updated 
ON tab_stashes(updated_at);

CREATE INDEX IF NOT EXISTS idx_tasks_updated 
ON tasks(updated_at);