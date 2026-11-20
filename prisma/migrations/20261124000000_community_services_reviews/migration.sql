CREATE TYPE "moderation_status" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');
CREATE TYPE "service_request_status" AS ENUM ('NEW', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'DECLINED', 'COMPLETED');

CREATE TABLE "guestbook_entries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(254),
  "message" VARCHAR(800) NOT NULL,
  "status" "moderation_status" NOT NULL DEFAULT 'PENDING',
  "ip_hash" VARCHAR(64),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guestbook_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "guestbook_entries_status_created_at_idx" ON "guestbook_entries"("status", "created_at");
CREATE INDEX "guestbook_entries_ip_hash_created_at_idx" ON "guestbook_entries"("ip_hash", "created_at");

CREATE TABLE "reviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "display_name" VARCHAR(100) NOT NULL,
  "message" VARCHAR(1000) NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "status" "moderation_status" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX "reviews_user_id_key" ON "reviews"("user_id");
CREATE INDEX "reviews_status_created_at_idx" ON "reviews"("status", "created_at");

CREATE TABLE "service_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "requester_name" VARCHAR(120) NOT NULL,
  "requester_email" VARCHAR(254) NOT NULL,
  "service_type" VARCHAR(60) NOT NULL,
  "description" TEXT NOT NULL,
  "budget_minor" INTEGER,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'GHS',
  "timeline" VARCHAR(160),
  "status" "service_request_status" NOT NULL DEFAULT 'NEW',
  "quote_minor" INTEGER,
  "quote_note" TEXT,
  "quoted_at" TIMESTAMPTZ(3),
  "ip_hash" VARCHAR(64),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "service_requests_budget_check" CHECK ("budget_minor" IS NULL OR "budget_minor" >= 0),
  CONSTRAINT "service_requests_quote_check" CHECK ("quote_minor" IS NULL OR "quote_minor" >= 0)
);
CREATE INDEX "service_requests_status_created_at_idx" ON "service_requests"("status", "created_at");
CREATE INDEX "service_requests_user_id_created_at_idx" ON "service_requests"("user_id", "created_at");
CREATE INDEX "service_requests_ip_hash_created_at_idx" ON "service_requests"("ip_hash", "created_at");
