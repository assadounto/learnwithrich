ALTER TABLE "resource_api_tokens"
  ADD COLUMN "can_upload" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "can_create_ideas" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "can_publish_resources" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "can_publish_ideas" BOOLEAN NOT NULL DEFAULT false;

-- Existing edit tokens could already create idea drafts.
UPDATE "resource_api_tokens" SET "can_create_ideas" = "can_edit" WHERE "can_edit" = true;
