/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `Restaurateur` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Patron" ADD COLUMN     "referredBy" TEXT;

-- AlterTable
ALTER TABLE "Restaurateur" ADD COLUMN     "referralBonusesEarned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralBonusesUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referralPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referredBy" TEXT;

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referralCode" TEXT NOT NULL,
    "referrerType" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredType" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurateur_referralCode_key" ON "Restaurateur"("referralCode");
