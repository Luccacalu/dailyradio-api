/*
  Warnings:

  - A unique constraint covering the columns `[email_verification_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "email_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "email_verification_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verification_token_key" ON "public"."users"("email_verification_token");
