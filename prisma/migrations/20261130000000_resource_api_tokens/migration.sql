CREATE TABLE "resource_api_tokens" (
    "id" UUID NOT NULL,
    "owner_id" TEXT NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "digest" CHAR(64) NOT NULL,
    "hint" CHAR(8) NOT NULL,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    CONSTRAINT "resource_api_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "resource_api_tokens_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "resource_api_tokens_digest_key" ON "resource_api_tokens"("digest");
CREATE INDEX "resource_api_tokens_owner_id_created_at_idx" ON "resource_api_tokens"("owner_id", "created_at");
