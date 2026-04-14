-- Add soft-delete columns expected by Prisma schema.
ALTER TABLE "faculty"
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

ALTER TABLE "students"
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
