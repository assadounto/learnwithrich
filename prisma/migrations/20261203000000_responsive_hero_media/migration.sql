ALTER TABLE "homepage_settings"
  ADD COLUMN "hero_mobile_image_asset_id" UUID,
  ADD COLUMN "hero_mobile_video_asset_id" UUID,
  ADD COLUMN "hero_video_enabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "homepage_settings" SET "hero_video_enabled" = true WHERE "hero_preset" = 'CINEMATIC';
