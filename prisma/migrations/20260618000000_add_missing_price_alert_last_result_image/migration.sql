-- Add the result image column used by Price Alert create/list UI.
-- This is safe to run against an existing production database.
ALTER TABLE "PriceAlert" ADD COLUMN IF NOT EXISTS "lastResultImage" TEXT;
