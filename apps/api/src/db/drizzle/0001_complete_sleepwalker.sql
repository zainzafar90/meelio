ALTER TABLE "weather_cache" DROP CONSTRAINT "weather_cache_user_id_unique";--> statement-breakpoint
ALTER TABLE "weather_cache" DROP CONSTRAINT "weather_cache_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "backgrounds" ADD COLUMN "metadata" jsonb;