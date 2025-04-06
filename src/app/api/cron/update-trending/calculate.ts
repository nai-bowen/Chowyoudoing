import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

export interface TrendingCalculationResult {
  topCategory: string;
  count: number;
  score: number;
  reviewCount: number;
}

export async function calculateTrendingCategories(): Promise<TrendingCalculationResult> {
  // Step 1: Set current active trending to inactive
  await db.trendingCategory.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  // Step 2: Get popular and recent reviews
  const recentReviews = await db.review.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: [
      { upvotes: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 100,
    select: {
      id: true,
      upvotes: true,
      createdAt: true,
      restaurant: {
        select: {
          id: true,
          interests: true
        }
      }
    }
  });

  // Step 3: Extract interests and calculate their frequency with weighting
  const interestScores = new Map<string, { count: number; score: number; reviewIds: string[] }>();

  recentReviews.forEach(review => {
    if (!review.restaurant?.interests) return;

    const daysSinceCreation = Math.max(1, (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = 1 / daysSinceCreation;
    const popularityScore = Math.log(review.upvotes + 2);
    const reviewScore = recencyScore * popularityScore;

    review.restaurant.interests.forEach(interest => {
      if (!interest) return;

      const current = interestScores.get(interest) || { count: 0, score: 0, reviewIds: [] };
      interestScores.set(interest, {
        count: current.count + 1,
        score: current.score + reviewScore,
        reviewIds: [...current.reviewIds, review.id]
      });
    });
  });

  // Step 4: Find the top interest
  let topCategory = "";
  let highestScore = 0;
  let highestCount = 0;
  const categoryEntries = Array.from(interestScores.entries());

  categoryEntries.forEach(([interest, data]) => {
    if (data.score > highestScore) {
      topCategory = interest;
      highestScore = data.score;
      highestCount = data.count;
    }
  });

  if (!topCategory && recentReviews.length > 0) {
    topCategory = "Popular";
    highestCount = recentReviews.length;
    highestScore = 1.0;
  } else if (!topCategory) {
    topCategory = "Food";
    highestCount = 0;
    highestScore = 0;
  }

  // Step 5: Store in DB
  if (topCategory) {
    const topCategoryData = interestScores.get(topCategory) || { count: highestCount, score: highestScore, reviewIds: [] };

    await db.trendingCategory.create({
      data: {
        category: topCategory,
        count: topCategoryData.count,
        score: topCategoryData.score,
        reviewIds: topCategoryData.reviewIds || [],
        reviewCount: recentReviews.length,
        isActive: true
      }
    });

    const otherTopCategories = categoryEntries
      .filter(([interest]) => interest !== topCategory)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 9);

    if (otherTopCategories.length > 0) {
      await Promise.all(otherTopCategories.map(([interest, data]) => {
        return db.trendingCategory.create({
          data: {
            category: interest,
            count: data.count,
            score: data.score,
            reviewIds: data.reviewIds,
            reviewCount: recentReviews.length,
            isActive: false
          }
        });
      }));
    }
  }

  return {
    topCategory,
    count: highestCount,
    score: highestScore,
    reviewCount: recentReviews.length
  };
}
