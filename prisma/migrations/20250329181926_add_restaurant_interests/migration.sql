-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];
