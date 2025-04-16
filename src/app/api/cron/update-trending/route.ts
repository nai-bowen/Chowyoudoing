// src/app/api/cron/update-trending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { calculateTrendingCategories } from "./calculate";

// Environment variables should be set in your .env file
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Check authorization - support both admin password and cron secret
    const authHeader = req.headers.get("authorization");
    
    // For production, enforce auth. For dev, allow without auth
    if (process.env.NODE_ENV === "production") {
      // No auth header provided
      if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized - Missing credentials" }, { status: 401 });
      }
      
      // Check if using Bearer token format (admin login)
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        
        // Check if it's admin password or cron secret
        if (token !== ADMIN_PASSWORD && token !== CRON_SECRET_TOKEN) {
          return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
        }
      } else {
        // Not using proper Bearer format
        return NextResponse.json({ error: "Unauthorized - Invalid auth format" }, { status: 401 });
      }
    }

    // Log information about who triggered the update
    const source = authHeader?.startsWith("Bearer ") && 
                  authHeader.split(" ")[1] === CRON_SECRET_TOKEN 
                  ? "Scheduled cron job" 
                  : "Manual admin trigger";
    
    console.log(`Updating trending categories. Source: ${source}`);

    // Calculate trending categories using the shared function
    const trendingData = await calculateTrendingCategories();

    return NextResponse.json({
      success: true,
      message: "Trending categories updated successfully",
      data: trendingData,
      source: source
    });
  } catch (error) {
    console.error("Error updating trending categories:", error);
    return NextResponse.json({ 
      error: "Failed to update trending categories", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

// Support GET requests too for testing/verification without making changes
export async function GET(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ 
    message: "This endpoint needs to be called with POST to trigger an update",
    info: "Use the admin dashboard to trigger updates manually"
  });
}