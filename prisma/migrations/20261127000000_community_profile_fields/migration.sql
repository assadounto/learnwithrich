ALTER TABLE "guestbook_entries"
  ADD COLUMN "title" VARCHAR(120),
  ADD COLUMN "country" VARCHAR(80),
  ADD COLUMN "image_asset_id" UUID;

ALTER TABLE "reviews"
  ADD COLUMN "title" VARCHAR(120),
  ADD COLUMN "country" VARCHAR(80),
  ADD COLUMN "image_asset_id" UUID;

CREATE INDEX "guestbook_entries_image_asset_id_idx" ON "guestbook_entries"("image_asset_id");
CREATE INDEX "reviews_image_asset_id_idx" ON "reviews"("image_asset_id");

ALTER TABLE "guestbook_entries"
  ADD CONSTRAINT "guestbook_entries_image_asset_id_fkey"
  FOREIGN KEY ("image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_image_asset_id_fkey"
  FOREIGN KEY ("image_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
