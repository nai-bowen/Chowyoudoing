-- AlterTable
ALTER TABLE "Patron" ADD COLUMN     "certificationDate" TIMESTAMP(3),
ADD COLUMN     "isCertifiedFoodie" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CertificationRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "justification" TEXT,
    "socialMediaLink" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "patronId" TEXT NOT NULL,

    CONSTRAINT "CertificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertificationRequest_patronId_key" ON "CertificationRequest"("patronId");

-- AddForeignKey
ALTER TABLE "CertificationRequest" ADD CONSTRAINT "CertificationRequest_patronId_fkey" FOREIGN KEY ("patronId") REFERENCES "Patron"("id") ON DELETE CASCADE ON UPDATE CASCADE;
