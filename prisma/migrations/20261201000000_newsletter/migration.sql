CREATE TABLE "newsletter_signups" (
    "email" VARCHAR(254) NOT NULL,
    "ip_hash" CHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMPTZ(3),
    CONSTRAINT "newsletter_signups_pkey" PRIMARY KEY ("email")
);

CREATE INDEX "newsletter_signups_created_at_idx" ON "newsletter_signups"("created_at");
CREATE INDEX "newsletter_signups_ip_hash_created_at_idx" ON "newsletter_signups"("ip_hash", "created_at");
