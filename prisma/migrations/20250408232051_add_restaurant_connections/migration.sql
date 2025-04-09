-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "restaurantResponse" TEXT;

-- CreateTable
CREATE TABLE "RestaurantConnectionRequest" (
    "id" TEXT NOT NULL,
    "restaurateurId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "RestaurantConnectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewFlag" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flaggedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewId" TEXT NOT NULL,

    CONSTRAINT "ReviewFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptVerification" (
    "id" TEXT NOT NULL,
    "receiptImage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewId" TEXT,
    "restaurantId" TEXT NOT NULL,

    CONSTRAINT "ReceiptVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantConnectionRequest_restaurateurId_restaurantId_key" ON "RestaurantConnectionRequest"("restaurateurId", "restaurantId");

-- AddForeignKey
ALTER TABLE "RestaurantConnectionRequest" ADD CONSTRAINT "RestaurantConnectionRequest_restaurateurId_fkey" FOREIGN KEY ("restaurateurId") REFERENCES "Restaurateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantConnectionRequest" ADD CONSTRAINT "RestaurantConnectionRequest_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFlag" ADD CONSTRAINT "ReviewFlag_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVerification" ADD CONSTRAINT "ReceiptVerification_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVerification" ADD CONSTRAINT "ReceiptVerification_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
