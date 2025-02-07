/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Restaurant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_url_key" ON "Restaurant"("url");
