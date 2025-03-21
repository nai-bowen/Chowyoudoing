-- CreateTable
CREATE TABLE "Restaurateur" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "restaurantName" TEXT NOT NULL,
    "businessRegNumber" TEXT,
    "vatNumber" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactPersonName" TEXT NOT NULL,
    "contactPersonPhone" TEXT NOT NULL,
    "contactPersonEmail" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "utilityBillUrl" TEXT,
    "businessLicenseUrl" TEXT,
    "foodHygieneCertUrl" TEXT,
    "storefrontPhotoUrl" TEXT,
    "receiptPhotoUrl" TEXT,
    "restaurantId" TEXT,

    CONSTRAINT "Restaurateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurateurAccount" (
    "id" TEXT NOT NULL,
    "restaurateurId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "RestaurateurAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurateurSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "restaurateurId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurateurSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurateur_email_key" ON "Restaurateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurateurAccount_provider_providerAccountId_key" ON "RestaurateurAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurateurSession_sessionToken_key" ON "RestaurateurSession"("sessionToken");

-- AddForeignKey
ALTER TABLE "Restaurateur" ADD CONSTRAINT "Restaurateur_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurateurAccount" ADD CONSTRAINT "RestaurateurAccount_restaurateurId_fkey" FOREIGN KEY ("restaurateurId") REFERENCES "Restaurateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurateurSession" ADD CONSTRAINT "RestaurateurSession_restaurateurId_fkey" FOREIGN KEY ("restaurateurId") REFERENCES "Restaurateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
