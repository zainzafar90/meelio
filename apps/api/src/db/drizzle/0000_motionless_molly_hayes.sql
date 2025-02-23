CREATE TYPE "public"."user_role" AS ENUM('user', 'guest');--> statement-breakpoint
CREATE TYPE "public"."account_provider" AS ENUM('google', 'password', 'magicLink');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"is_email_verified" boolean DEFAULT false,
	"image" varchar(255),
	"role" "user_role" DEFAULT 'user' NOT NULL,
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
	"provider" "account_provider" NOT NULL,
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
CREATE INDEX "idx_users_name" ON "users" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_tokens_token_type" ON "verification_tokens" USING btree ("token","type");--> statement-breakpoint
CREATE INDEX "idx_tokens_email" ON "verification_tokens" USING btree ("email");