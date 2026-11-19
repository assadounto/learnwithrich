ALTER TABLE "sessions" ADD COLUMN "mfa_verified_at" TIMESTAMPTZ(3);
CREATE TABLE "owner_mfa" (
  "user_id" TEXT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "secret_ciphertext" TEXT,
  "enabled_at" TIMESTAMPTZ(3),
  "pending_session_id" TEXT,
  "pending_expires_at" TIMESTAMPTZ(3),
  "last_used_step" INTEGER NOT NULL DEFAULT -1,
  "recovery_hashes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "failed_attempts" INTEGER NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMPTZ(3),
  CONSTRAINT "mfa_attempts_nonnegative" CHECK ("failed_attempts" >= 0)
);
-- Require a fresh Google sign-in before the first enrollment after upgrade.
DELETE FROM "sessions" WHERE "user_id" IN (SELECT "id" FROM "users" WHERE "role" = 'OWNER');
