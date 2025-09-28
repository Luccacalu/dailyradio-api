-- CreateEnum
CREATE TYPE "public"."StationVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "public"."stations" ADD COLUMN     "visibility" "public"."StationVisibility" NOT NULL DEFAULT 'PUBLIC';
