CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"password" varchar(255),
	"is_email_verified" boolean DEFAULT false,
	"image" varchar(255),
	"role" text DEFAULT 'user' NOT NULL,
	"settings" jsonb DEFAULT '{"pomodoro":{"workDuration":25,"breakDuration":5,"autoStart":false,"autoBlock":false,"soundOn":true,"dailyFocusLimit":120},"onboardingCompleted":false,"task":{"confettiOnComplete":false},"calendar":{"enabled":false}}'::jsonb NOT NULL,
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
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"access_token" text NOT NULL,
	"access_token_expires" timestamp,
	"refresh_token" text,
	"refresh_token_expires" timestamp,
	"device_info" text,
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
	"completed" boolean DEFAULT false NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"due_date" timestamp with time zone,
	"category_id" uuid,
	"provider_id" uuid,
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
CREATE TABLE "calendar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "task_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_category" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "providers" (
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
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX "idx_users_name" ON "users" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_tokens_token_type" ON "verification_tokens" USING btree ("token","type");--> statement-breakpoint
CREATE INDEX "idx_tokens_email" ON "verification_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_sessions_token" ON "sessions" USING btree ("access_token");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_blacklisted" ON "sessions" USING btree ("user_id","blacklisted");--> statement-breakpoint
CREATE INDEX "idx_sessions_expiration" ON "sessions" USING btree ("access_token_expires","refresh_token_expires");--> statement-breakpoint
CREATE INDEX "idx_mantras_user_id" ON "mantras" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mantras_type" ON "mantras" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_mantras_date" ON "mantras" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_tasks_user_id" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_completed" ON "tasks" USING btree ("completed");--> statement-breakpoint
CREATE INDEX "idx_tasks_pinned" ON "tasks" USING btree ("pinned");--> statement-breakpoint
CREATE INDEX "idx_tasks_due_date" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_tasks_category_id" ON "tasks" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_provider_id" ON "tasks" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_site_blockers_user_id" ON "site_blockers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_site_blockers_category" ON "site_blockers" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_site_blockers_url" ON "site_blockers" USING btree ("url");--> statement-breakpoint
CREATE INDEX "idx_tab_stashes_user_id" ON "tab_stashes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tab_stashes_window_id" ON "tab_stashes" USING btree ("window_id");--> statement-breakpoint
CREATE INDEX "idx_notes_user_id" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notes_title" ON "notes" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_focus_sessions_user_id" ON "focus_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_focus_sessions_start" ON "focus_sessions" USING btree ("session_start");--> statement-breakpoint
CREATE INDEX "idx_focus_sessions_end" ON "focus_sessions" USING btree ("session_end");--> statement-breakpoint
CREATE INDEX "idx_calendar_user_id" ON "calendar" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_categories_user_id" ON "task_categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_providers_name" ON "providers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_providers_enabled" ON "providers" USING btree ("enabled");