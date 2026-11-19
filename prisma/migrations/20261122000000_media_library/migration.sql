CREATE TABLE "media_folders" (
  "id" UUID NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "media_assets" (
  "id" UUID NOT NULL,
  "folder_id" UUID,
  "original_name" VARCHAR(180) NOT NULL,
  "storage_key" VARCHAR(100) NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_folders_name_key" ON "media_folders"("name");
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");
CREATE INDEX "media_assets_folder_id_created_at_idx" ON "media_assets"("folder_id", "created_at");
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
