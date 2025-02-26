-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "asExpected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "valueForMoney" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "wouldRecommend" BOOLEAN NOT NULL DEFAULT false;
