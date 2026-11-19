ALTER TABLE "resource_content" ADD COLUMN "details" JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "resource_content" ADD CONSTRAINT "resource_details_object" CHECK (jsonb_typeof("details") = 'object');
