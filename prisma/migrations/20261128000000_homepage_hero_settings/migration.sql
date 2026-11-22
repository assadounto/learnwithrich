ALTER TABLE "homepage_settings"
  ADD COLUMN "hero_preset" VARCHAR(20) NOT NULL DEFAULT 'CLASSIC',
  ADD COLUMN "hero_video_asset_id" UUID,
  ADD COLUMN "hero_delay_seconds" INTEGER NOT NULL DEFAULT 5;
