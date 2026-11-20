CREATE TABLE "service_request_files" (
  "service_request_id" UUID NOT NULL,
  "media_asset_id" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_request_files_pkey" PRIMARY KEY ("service_request_id", "media_asset_id"),
  CONSTRAINT "service_request_files_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "service_request_files_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "service_request_files_service_request_id_position_key" UNIQUE ("service_request_id", "position")
);
CREATE INDEX "service_request_files_media_asset_id_idx" ON "service_request_files"("media_asset_id");
