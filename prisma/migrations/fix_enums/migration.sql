-- CreateEnum für ProjectStatus falls nicht existiert
DO $$ BEGIN
    CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Temporäre Spalte für die Migration erstellen
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "status_new" "ProjectStatus";

-- Konvertiere String-Werte zu Enum-Werten
UPDATE "Project"
SET "status_new" = 
    CASE 
        WHEN "status" = 'ACTIVE' THEN 'ACTIVE'::"ProjectStatus"
        WHEN "status" = 'ON_HOLD' THEN 'ON_HOLD'::"ProjectStatus"
        WHEN "status" = 'COMPLETED' THEN 'COMPLETED'::"ProjectStatus"
        WHEN "status" = 'ARCHIVED' THEN 'ARCHIVED'::"ProjectStatus"
        ELSE 'ACTIVE'::"ProjectStatus"
    END
WHERE "status_new" IS NULL;

-- Lösche alte Spalte und benenne neue um
ALTER TABLE "Project" DROP COLUMN IF EXISTS "status";
ALTER TABLE "Project" RENAME COLUMN "status_new" TO "status";

-- Setze Default und NOT NULL
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"ProjectStatus";
ALTER TABLE "Project" ALTER COLUMN "status" SET NOT NULL;

-- Füge category Spalte zu Contact hinzu falls nicht existiert
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "category" TEXT;