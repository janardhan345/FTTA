-- DropIndex (remove old unique constraint on token)
DROP INDEX IF EXISTS "active_qr_token_key";

-- DropIndex (remove old unique constraint on qr_token in sessions - allows same QR type for multiple sessions)
DROP INDEX IF EXISTS "sessions_qr_token_key";

-- AlterTable: Convert active_qr table from single token to two tokens
-- First, add the new columns with default values
ALTER TABLE "active_qr" ADD COLUMN "attendance_token" TEXT NOT NULL DEFAULT 'FTTA_ATTENDANCE';
ALTER TABLE "active_qr" ADD COLUMN "session_token" TEXT NOT NULL DEFAULT 'FTTA_SESSION';

-- Drop the old columns
ALTER TABLE "active_qr" DROP COLUMN "token";
ALTER TABLE "active_qr" DROP COLUMN "expires_at";

-- CreateTable: attendance
CREATE TABLE "attendance" (
    "id" SERIAL NOT NULL,
    "checkin_time" TIMESTAMP(3) NOT NULL,
    "checkout_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "faculty_id" TEXT NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- AlterTable: sessions (remove qr_expires_at, make qr_token non-unique)
ALTER TABLE "sessions" DROP COLUMN "qr_expires_at";

-- CreateIndex: Add unique constraints for the new QR tokens
CREATE UNIQUE INDEX "active_qr_attendance_token_key" ON "active_qr"("attendance_token");
CREATE UNIQUE INDEX "active_qr_session_token_key" ON "active_qr"("session_token");

-- AddForeignKey: attendance to faculty
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
