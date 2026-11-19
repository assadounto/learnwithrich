CREATE TABLE "homepage_settings" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "sections" JSONB NOT NULL DEFAULT '[]',
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "homepage_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "homepage_settings_singleton_check" CHECK ("id" = 1),
  CONSTRAINT "homepage_settings_sections_array_check" CHECK (jsonb_typeof("sections") = 'array')
);
