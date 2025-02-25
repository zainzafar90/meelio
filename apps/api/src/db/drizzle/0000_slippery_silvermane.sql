CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"password" varchar(255),
	"is_email_verified" boolean DEFAULT false,
	"image" varchar(255),
	"role" text DEFAULT 'user' NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp,
	"blacklisted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text,
	"refresh_token" text,
	"access_token" text,
	"access_token_expires" timestamp,
	"refresh_token_expires" timestamp,
	"id_token" text,
	"scope" text,
	"blacklisted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lemon_squeezy_id" text NOT NULL,
	"subscription_item_id" text NOT NULL,
	"order_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"status" text NOT NULL,
	"price_id" text NOT NULL,
	"plan_id" text,
	"renews_at" timestamp,
	"ends_at" timestamp,
	"trial_ends_at" timestamp,
	"resumes_at" timestamp,
	"user_id" text NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL,
	"product_name" text,
	"update_payment_url" text,
	"customer_portal_url" text,
	"is_usage_based" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" text NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"event_body" jsonb NOT NULL,
	"processing_error" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backgrounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"schedule" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soundscapes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"config" jsonb,
	"shareable" boolean DEFAULT false,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mantras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"text" text NOT NULL,
	"type" text NOT NULL,
	"date" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"is_focus" boolean DEFAULT false,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pomodoro_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"work_duration" integer DEFAULT 25 NOT NULL,
	"break_duration" integer DEFAULT 5 NOT NULL,
	"auto_start" boolean DEFAULT false,
	"auto_block" boolean DEFAULT false,
	"sound_on" boolean DEFAULT true,
	"daily_focus_limit" integer DEFAULT 120,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_blockers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"category" text,
	"url" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tab_stashes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"window_id" text NOT NULL,
	"urls" text[] NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weather_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"weather_data" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weather_cache_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "breathepod" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"config" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "focus_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"session_start" timestamp with time zone NOT NULL,
	"session_end" timestamp with time zone NOT NULL,
	"duration" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weather_cache" ADD CONSTRAINT "weather_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_name" ON "users" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_tokens_token_type" ON "verification_tokens" USING btree ("token","type");--> statement-breakpoint
CREATE INDEX "idx_tokens_email" ON "verification_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_backgrounds_user_id" ON "backgrounds" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_backgrounds_type" ON "backgrounds" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_soundscapes_user_id" ON "soundscapes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_soundscapes_name" ON "soundscapes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_soundscapes_shareable" ON "soundscapes" USING btree ("shareable");--> statement-breakpoint
CREATE INDEX "idx_mantras_user_id" ON "mantras" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mantras_type" ON "mantras" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_mantras_date" ON "mantras" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_tasks_user_id" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_category" ON "tasks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tasks_is_focus" ON "tasks" USING btree ("is_focus");--> statement-breakpoint
CREATE INDEX "idx_tasks_due_date" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_pomodoro_settings_user_id" ON "pomodoro_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_site_blockers_user_id" ON "site_blockers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_site_blockers_category" ON "site_blockers" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_site_blockers_url" ON "site_blockers" USING btree ("url");--> statement-breakpoint
CREATE INDEX "idx_tab_stashes_user_id" ON "tab_stashes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tab_stashes_window_id" ON "tab_stashes" USING btree ("window_id");--> statement-breakpoint
CREATE INDEX "idx_notes_user_id" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notes_title" ON "notes" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_weather_cache_user_id" ON "weather_cache" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_breathepod_user_id" ON "breathepod" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_focus_sessions_user_id" ON "focus_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_focus_sessions_start" ON "focus_sessions" USING btree ("session_start");--> statement-breakpoint
CREATE INDEX "idx_focus_sessions_end" ON "focus_sessions" USING btree ("session_end");