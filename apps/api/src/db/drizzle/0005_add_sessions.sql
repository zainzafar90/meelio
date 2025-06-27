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

CREATE INDEX "idx_sessions_token" ON "sessions" USING btree ("access_token");
