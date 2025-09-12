-- CreateEnum
CREATE TYPE "public"."StationMode" AS ENUM ('FREEFLOW', 'BACKSTAGE', 'TOUR');

-- AlterTable
ALTER TABLE "public"."stations" ADD COLUMN     "mode" "public"."StationMode" NOT NULL DEFAULT 'FREEFLOW',
ALTER COLUMN "max_songs_per_user_per_set" DROP NOT NULL,
ALTER COLUMN "voting_threshold_percent" DROP NOT NULL;
