CREATE TABLE "user_background_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"background_id" text NOT NULL,
	"is_selected" boolean DEFAULT false,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_backgrounds_user_id";--> statement-breakpoint
ALTER TABLE "backgrounds" ADD COLUMN "is_default" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX "idx_user_bg_views_user_id" ON "user_background_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_bg_views_bg_id" ON "user_background_views" USING btree ("background_id");--> statement-breakpoint
CREATE INDEX "idx_user_bg_views_unique" ON "user_background_views" USING btree ("user_id","background_id");--> statement-breakpoint
ALTER TABLE "backgrounds" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "backgrounds" DROP COLUMN "is_selected";--> statement-breakpoint
ALTER TABLE "backgrounds" DROP COLUMN "is_shown";--> statement-breakpoint
ALTER TABLE "backgrounds" DROP COLUMN "default_background_id";