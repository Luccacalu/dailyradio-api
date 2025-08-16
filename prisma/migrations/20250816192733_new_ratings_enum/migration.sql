/*
  Warnings:

  - The values [REVIEW_ONLY,STARS_ONLY,REVIEW_AND_STARS,OPTIONAL_REVIEW,OPTIONAL_STARS] on the enum `RatingSystem` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ReviewSystem" AS ENUM ('TRUE', 'FALSE', 'OPTIONAL');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."RatingSystem_new" AS ENUM ('TRUE', 'FALSE', 'OPTIONAL');
ALTER TABLE "public"."stations" ALTER COLUMN "rating_system" DROP DEFAULT;
ALTER TABLE "public"."stations" ALTER COLUMN "rating_system" TYPE "public"."RatingSystem_new" USING ("rating_system"::text::"public"."RatingSystem_new");
ALTER TYPE "public"."RatingSystem" RENAME TO "RatingSystem_old";
ALTER TYPE "public"."RatingSystem_new" RENAME TO "RatingSystem";
DROP TYPE "public"."RatingSystem_old";
ALTER TABLE "public"."stations" ALTER COLUMN "rating_system" SET DEFAULT 'OPTIONAL';
COMMIT;

-- AlterTable
ALTER TABLE "public"."stations" ADD COLUMN     "review_system" "public"."ReviewSystem" NOT NULL DEFAULT 'TRUE',
ALTER COLUMN "rating_system" SET DEFAULT 'OPTIONAL';
