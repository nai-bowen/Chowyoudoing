/*eslint-disable*/
import { NextRequest, NextResponse } from "next/server";
import { calculateTrendingCategories } from "../../cron/update-trending/calculate";

// Environment variables should be set in your .env file
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Validate admin authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    // Calculate trending categories using the shared function
    const trendingData = await calculateTrendingCategories();

    return NextResponse.json({
      success: true,
      message: "Trending categories updated successfully",
      data: trendingData
    });
  } catch (error) {
    console.error("Error manually updating trending categories:", error);
    return NextResponse.json({ 
      error: "Failed to update trending categories", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}