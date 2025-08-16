-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'BANNED');

-- CreateEnum
CREATE TYPE "public"."StationRole" AS ENUM ('ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."RatingSystem" AS ENUM ('REVIEW_ONLY', 'STARS_ONLY', 'REVIEW_AND_STARS', 'OPTIONAL_REVIEW', 'OPTIONAL_STARS');

-- CreateEnum
CREATE TYPE "public"."SetStatus" AS ENUM ('ACTIVE', 'FINISHED', 'FINISHED_AND_OPEN');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "bio" TEXT,
    "spotify_profile_url" TEXT,
    "image_url" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "password_hash" TEXT,
    "max_songs_per_user_per_set" INTEGER NOT NULL DEFAULT 1,
    "voting_threshold_percent" INTEGER NOT NULL DEFAULT 100,
    "rating_system" "public"."RatingSystem" NOT NULL DEFAULT 'REVIEW_AND_STARS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creator_id" TEXT NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sets" (
    "id" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "status" "public"."SetStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "station_id" TEXT NOT NULL,

    CONSTRAINT "sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."music_submissions" (
    "id" TEXT NOT NULL,
    "song_title" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "youtube_url" TEXT,
    "spotify_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "submitter_id" TEXT,
    "set_id" TEXT NOT NULL,

    CONSTRAINT "music_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "author_id" TEXT,
    "submission_id" TEXT NOT NULL,
    "parent_id" TEXT,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."set_comments" (
    "id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "author_id" TEXT,
    "set_id" TEXT NOT NULL,
    "parent_id" TEXT,

    CONSTRAINT "set_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."set_ready_votes" (
    "user_id" TEXT NOT NULL,
    "set_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_ready_votes_pkey" PRIMARY KEY ("user_id","set_id")
);

-- CreateTable
CREATE TABLE "public"."station_members" (
    "user_id" TEXT NOT NULL,
    "station_id" TEXT NOT NULL,
    "role" "public"."StationRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "station_members_pkey" PRIMARY KEY ("user_id","station_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "sets_station_id_idx" ON "public"."sets"("station_id");

-- CreateIndex
CREATE INDEX "music_submissions_set_id_idx" ON "public"."music_submissions"("set_id");

-- AddForeignKey
ALTER TABLE "public"."stations" ADD CONSTRAINT "stations_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sets" ADD CONSTRAINT "sets_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."music_submissions" ADD CONSTRAINT "music_submissions_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."music_submissions" ADD CONSTRAINT "music_submissions_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."music_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."reviews"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."set_comments" ADD CONSTRAINT "set_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."set_comments" ADD CONSTRAINT "set_comments_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."set_comments" ADD CONSTRAINT "set_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."set_comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."set_ready_votes" ADD CONSTRAINT "set_ready_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."set_ready_votes" ADD CONSTRAINT "set_ready_votes_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."station_members" ADD CONSTRAINT "station_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."station_members" ADD CONSTRAINT "station_members_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
