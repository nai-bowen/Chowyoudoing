/*
  Warnings:

  - The `verificationStatus` column on the `Restaurateur` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `RestaurateurAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "widerAreas" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Restaurateur" DROP COLUMN "verificationStatus",
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "RestaurateurAccount" ADD COLUMN     "businessRegNumber" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "vatNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RestaurateurAccount_email_key" ON "RestaurateurAccount"("email");
