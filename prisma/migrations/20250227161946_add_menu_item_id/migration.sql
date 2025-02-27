/*
  Warnings:

  - The `asExpected` column on the `Review` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `valueForMoney` column on the `Review` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `wouldRecommend` column on the `Review` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "menuItemId" TEXT,
DROP COLUMN "asExpected",
ADD COLUMN     "asExpected" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "valueForMoney",
ADD COLUMN     "valueForMoney" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "wouldRecommend",
ADD COLUMN     "wouldRecommend" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
