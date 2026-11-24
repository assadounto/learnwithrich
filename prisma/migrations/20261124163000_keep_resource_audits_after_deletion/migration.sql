ALTER TABLE "resource_audits"
  DROP CONSTRAINT "resource_audits_resource_id_fkey",
  ALTER COLUMN "resource_id" DROP NOT NULL,
  ADD CONSTRAINT "resource_audits_resource_id_fkey"
    FOREIGN KEY ("resource_id") REFERENCES "resources"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
