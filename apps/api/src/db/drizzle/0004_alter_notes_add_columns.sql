-- Alter notes to add category/provider and soft delete
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "category_id" uuid;
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "provider_id" uuid;
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone;
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "pinned" boolean DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_notes_category_id" ON "notes" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_notes_provider_id" ON "notes" ("provider_id");
