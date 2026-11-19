CREATE TYPE "purchase_status" AS ENUM ('PENDING', 'PAID', 'FAILED');

CREATE TABLE "resource_media" (
  "id" UUID NOT NULL,
  "resource_id" UUID NOT NULL,
  "media_asset_id" UUID NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "price_minor" INTEGER NOT NULL DEFAULT 0,
  "position" INTEGER NOT NULL,
  CONSTRAINT "resource_media_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "resource_media_price_minor_check" CHECK ("price_minor" >= 0)
);

CREATE TABLE "saved_resources" (
  "user_id" TEXT NOT NULL,
  "resource_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_resources_pkey" PRIMARY KEY ("user_id", "resource_id")
);

CREATE TABLE "purchases" (
  "id" UUID NOT NULL,
  "user_id" TEXT NOT NULL,
  "resource_id" UUID,
  "resource_media_id" UUID,
  "reference" VARCHAR(100) NOT NULL,
  "checkout_url" TEXT,
  "amount_minor" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "status" "purchase_status" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paid_at" TIMESTAMPTZ(3),
  "paystack_id" VARCHAR(80),
  CONSTRAINT "purchases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "purchases_one_product_check" CHECK (("resource_id" IS NOT NULL)::int + ("resource_media_id" IS NOT NULL)::int = 1),
  CONSTRAINT "purchases_amount_minor_check" CHECK ("amount_minor" > 0)
);

CREATE UNIQUE INDEX "resource_media_resource_id_media_asset_id_key" ON "resource_media"("resource_id", "media_asset_id");
CREATE UNIQUE INDEX "resource_media_resource_id_position_key" ON "resource_media"("resource_id", "position");
CREATE INDEX "resource_media_media_asset_id_idx" ON "resource_media"("media_asset_id");
CREATE INDEX "saved_resources_resource_id_idx" ON "saved_resources"("resource_id");
CREATE UNIQUE INDEX "purchases_reference_key" ON "purchases"("reference");
CREATE INDEX "purchases_user_id_status_created_at_idx" ON "purchases"("user_id", "status", "created_at");
CREATE INDEX "purchases_resource_id_user_id_status_idx" ON "purchases"("resource_id", "user_id", "status");
CREATE INDEX "purchases_resource_media_id_user_id_status_idx" ON "purchases"("resource_media_id", "user_id", "status");
CREATE UNIQUE INDEX "purchases_pending_resource_user_key" ON "purchases"("user_id", "resource_id") WHERE "status" = 'PENDING' AND "resource_id" IS NOT NULL;
CREATE UNIQUE INDEX "purchases_pending_media_user_key" ON "purchases"("user_id", "resource_media_id") WHERE "status" = 'PENDING' AND "resource_media_id" IS NOT NULL;

ALTER TABLE "media_assets" ALTER COLUMN "storage_key" TYPE VARCHAR(255);
ALTER TABLE "resource_media" ADD CONSTRAINT "resource_media_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_media" ADD CONSTRAINT "resource_media_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_resource_media_id_fkey" FOREIGN KEY ("resource_media_id") REFERENCES "resource_media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "saved_resources" ADD CONSTRAINT "saved_resources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_resources" ADD CONSTRAINT "saved_resources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
