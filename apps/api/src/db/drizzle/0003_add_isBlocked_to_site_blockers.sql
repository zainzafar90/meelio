ALTER TABLE "site_blockers" ADD COLUMN "is_blocked" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_idx" ON "subscriptions" USING btree ("email");