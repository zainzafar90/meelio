-- Create category_name enum type
CREATE TYPE "public"."category_name" AS ENUM('Productivity', 'Relax', 'NoiseBlocker', 'CreativeThinking', 'BeautifulAmbients', 'Random', 'Motivation', 'Sleep', 'Studying', 'Writing');

-- Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "category_name" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);

-- Create providers table
CREATE TABLE IF NOT EXISTS "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"client_id" text,
	"client_secret" text,
	"scopes" json DEFAULT '[]'::json,
	"auth_url" text,
	"token_url" text,
	"user_info_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "providers_name_unique" UNIQUE("name")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_categories_name" ON "categories" USING btree ("name");
CREATE INDEX IF NOT EXISTS "idx_providers_name" ON "providers" USING btree ("name");
CREATE INDEX IF NOT EXISTS "idx_providers_enabled" ON "providers" USING btree ("enabled");