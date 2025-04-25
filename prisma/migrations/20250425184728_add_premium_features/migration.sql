-- AlterTable
ALTER TABLE "Restaurateur" ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "premiumExpiresAt" TIMESTAMP(3),
ADD COLUMN     "premiumSince" TIMESTAMP(3),
ADD COLUMN     "responseQuotaRemaining" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "responseQuotaReset" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
