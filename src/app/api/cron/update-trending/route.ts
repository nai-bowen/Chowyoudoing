// src/app/api/cron/update-trending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { calculateTrendingCategories } from "./calculate";



export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Check for authorization (in production)
    const authHeader = req.headers.get("authorization");
    if (process.env.NODE_ENV === "production" && 
        (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate trending categories using the shared function
    const trendingData = await calculateTrendingCategories();

    return NextResponse.json({
      success: true,
      message: "Trending categories updated successfully",
      data: trendingData
    });
  } catch (error) {
    console.error("Error updating trending categories:", error);
    return NextResponse.json({ 
      error: "Failed to update trending categories", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}