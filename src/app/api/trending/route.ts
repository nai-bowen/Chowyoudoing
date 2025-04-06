// src/app/api/trending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { calculateTrendingCategories } from "../cron/update-trending/calculate"; // Import the shared function

export interface TrendingResponse {
  trending: {
    category: string;
    count: number;
    score: number;
    lastUpdated: string;
    reviewCount: number;
  } | null;
  recentCategories: Array<{
    category: string;
    count: number;
  }>;
  calculated?: boolean; // Flag to indicate if data was calculated on-demand
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the currently active trending category
    const activeTrending = await db.trendingCategory.findFirst({
      where: {
        isActive: true
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    });

    // If no trending data exists, calculate it on-demand
    if (!activeTrending) {
      console.log("No trending data found, calculating on-demand...");
      
      try {
        // Calculate trending data
        const calculatedData = await calculateTrendingCategories();
        
        // Check if calculation resulted in a valid category
        if (calculatedData.topCategory) {
          // Get the newly created trending record
          const freshTrending = await db.trendingCategory.findFirst({
            where: {
              isActive: true
            },
            orderBy: {
              lastUpdated: 'desc'
            }
          });
          
          // Get other recent categories
          const freshRecentCategories = await db.trendingCategory.findMany({
            where: {
              isActive: false
            },
            orderBy: [
              { score: 'desc' },
              { lastUpdated: 'desc' }
            ],
            take: 5,
            select: {
              category: true,
              count: true
            }
          });
          
          // Return the newly calculated data
          if (freshTrending) {
            const response: TrendingResponse = {
              trending: {
                category: freshTrending.category,
                count: freshTrending.count,
                score: freshTrending.score,
                lastUpdated: freshTrending.lastUpdated.toISOString(),
                reviewCount: freshTrending.reviewCount
              },
              recentCategories: freshRecentCategories.map(cat => ({
                category: cat.category,
                count: cat.count
              })),
              calculated: true // Indicate that we calculated this on-demand
            };
            
            return NextResponse.json(response);
          }
        }
      } catch (calculationError) {
        console.error("Error calculating trending data on-demand:", calculationError);
        // Continue to return null trending if calculation failed
      }
    }

    // Get other recent categories (limited to top 5)
    const recentCategories = await db.trendingCategory.findMany({
      where: {
        isActive: false
      },
      orderBy: [
        { score: 'desc' },
        { lastUpdated: 'desc' }
      ],
      take: 5,
      select: {
        category: true,
        count: true
      }
    });

    const response: TrendingResponse = {
      trending: activeTrending ? {
        category: activeTrending.category,
        count: activeTrending.count,
        score: activeTrending.score,
        lastUpdated: activeTrending.lastUpdated.toISOString(),
        reviewCount: activeTrending.reviewCount
      } : null,
      recentCategories: recentCategories.map(cat => ({
        category: cat.category,
        count: cat.count
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching trending categories:", error);
    return NextResponse.json({ 
      error: "Failed to fetch trending categories", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}