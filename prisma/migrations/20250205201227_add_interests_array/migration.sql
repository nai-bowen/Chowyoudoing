/*
  Warnings:

  - The `interests` column on the `Patron` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Patron" DROP COLUMN "interests",
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];
