CREATE TABLE "site_contact_settings" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "links" JSONB NOT NULL DEFAULT '{}',
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "site_contact_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "site_contact_settings" ("id", "links", "updated_at")
VALUES (1, '{"github":"https://github.com/assadounto"}'::jsonb, CURRENT_TIMESTAMP);
