-- Add tabs_data column to store tab metadata
ALTER TABLE "tab_stashes" ADD COLUMN "tabs_data" jsonb;