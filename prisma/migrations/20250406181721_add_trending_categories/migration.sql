-- CreateTable
CREATE TABLE "TrendingCategory" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reviewIds" TEXT[],
    "reviewCount" INTEGER NOT NULL,

    CONSTRAINT "TrendingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrendingCategory_isActive_lastUpdated_idx" ON "TrendingCategory"("isActive", "lastUpdated");
