-- CreateTable
CREATE TABLE "UserVotes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "isUpvote" BOOLEAN NOT NULL,

    CONSTRAINT "UserVotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserVotes_userId_reviewId_key" ON "UserVotes"("userId", "reviewId");

-- AddForeignKey
ALTER TABLE "UserVotes" ADD CONSTRAINT "UserVotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Patron"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVotes" ADD CONSTRAINT "UserVotes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
