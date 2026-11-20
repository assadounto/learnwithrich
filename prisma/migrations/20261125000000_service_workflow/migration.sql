ALTER TYPE "service_request_status" ADD VALUE IF NOT EXISTS 'PAYMENT_PENDING';

CREATE TYPE "service_payment_purpose" AS ENUM ('QUOTE', 'REVISION');
CREATE TYPE "service_revision_status" AS ENUM ('REQUESTED', 'PAYMENT_PENDING', 'DRAFT', 'AWAITING_APPROVAL', 'CHANGES_REQUESTED', 'APPROVED');

ALTER TABLE "service_requests"
  ADD COLUMN "requester_phone" VARCHAR(32) NOT NULL DEFAULT '',
  ADD COLUMN "included_revisions" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "used_included_revisions" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "extra_revision_price_minor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "service_requests"
  ADD CONSTRAINT "service_requests_included_revisions_check" CHECK ("included_revisions" >= 0),
  ADD CONSTRAINT "service_requests_used_revisions_check" CHECK ("used_included_revisions" >= 0),
  ADD CONSTRAINT "service_requests_extra_revision_price_check" CHECK ("extra_revision_price_minor" >= 0);

CREATE TABLE "service_revisions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "service_request_id" UUID NOT NULL,
  "revision_number" INTEGER NOT NULL,
  "status" "service_revision_status" NOT NULL DEFAULT 'REQUESTED',
  "requester_note" TEXT,
  "title" VARCHAR(180) NOT NULL,
  "summary" TEXT NOT NULL DEFAULT '',
  "changes_made" TEXT NOT NULL DEFAULT '',
  "requester_feedback" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "submitted_at" TIMESTAMPTZ(3),
  "approved_at" TIMESTAMPTZ(3),
  CONSTRAINT "service_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_revisions_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "service_revisions_number_check" CHECK ("revision_number" >= 0),
  CONSTRAINT "service_revisions_service_request_id_revision_number_key" UNIQUE ("service_request_id", "revision_number")
);
CREATE INDEX "service_revisions_service_request_id_status_revision_number_idx" ON "service_revisions"("service_request_id", "status", "revision_number");

CREATE TABLE "service_payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "service_request_id" UUID NOT NULL,
  "service_revision_id" UUID,
  "user_id" TEXT NOT NULL,
  "purpose" "service_payment_purpose" NOT NULL,
  "reference" VARCHAR(100) NOT NULL,
  "checkout_url" TEXT,
  "amount_minor" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "status" "purchase_status" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paid_at" TIMESTAMPTZ(3),
  "paystack_id" VARCHAR(80),
  CONSTRAINT "service_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_payments_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "service_payments_service_revision_id_fkey" FOREIGN KEY ("service_revision_id") REFERENCES "service_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "service_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "service_payments_reference_key" UNIQUE ("reference"),
  CONSTRAINT "service_payments_service_revision_id_key" UNIQUE ("service_revision_id"),
  CONSTRAINT "service_payments_amount_check" CHECK ("amount_minor" > 0)
);
ALTER TABLE "service_payments"
  ADD CONSTRAINT "service_payments_purpose_revision_check" CHECK (("purpose" = 'QUOTE' AND "service_revision_id" IS NULL) OR ("purpose" = 'REVISION' AND "service_revision_id" IS NOT NULL));
CREATE INDEX "service_payments_user_id_status_created_at_idx" ON "service_payments"("user_id", "status", "created_at");
CREATE INDEX "service_payments_service_request_id_purpose_status_idx" ON "service_payments"("service_request_id", "purpose", "status");
CREATE UNIQUE INDEX "service_payments_one_pending_quote_per_request" ON "service_payments"("service_request_id") WHERE "purpose" = 'QUOTE' AND "status" = 'PENDING';
CREATE UNIQUE INDEX "service_payments_one_paid_quote_per_request" ON "service_payments"("service_request_id") WHERE "purpose" = 'QUOTE' AND "status" = 'PAID';

CREATE TABLE "service_revision_files" (
  "revision_id" UUID NOT NULL,
  "media_asset_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "service_revision_files_pkey" PRIMARY KEY ("revision_id", "media_asset_id"),
  CONSTRAINT "service_revision_files_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "service_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "service_revision_files_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "service_revision_files_revision_id_position_key" UNIQUE ("revision_id", "position")
);
