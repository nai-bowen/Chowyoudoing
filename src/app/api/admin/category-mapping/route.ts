import { NextRequest, NextResponse } from "next/server";
import { 
  getAllUniqueCategories, 
  generateCategoryMappings,
  updateAllRestaurantsInterests,
  CategoryMapping
} from "@/utils/categoryMappingService";

// GET endpoint to fetch all unique categories
export async function GET(): Promise<NextResponse> {
  try {
    const categories = await getAllUniqueCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST endpoint to generate mappings using transformer.js embeddings
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Safely parse JSON, handling potential parsing errors
    let reqData;
    try {
      reqData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const { categories, threshold } = reqData as { 
      categories?: string[]; 
      threshold?: number;
    };
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty categories array" },
        { status: 400 }
      );
    }
    
    // Limit batch size to prevent timeout errors
    const maxBatchSize = 20;
    const processCategories = categories.slice(0, maxBatchSize);
    
    if (processCategories.length < categories.length) {
      console.log(`Processing only ${processCategories.length} of ${categories.length} categories to prevent timeout`);
    }
    
    const similarityThreshold = threshold || 0.75;
    
    // Generate mappings with proper error handling
    try {
      const mappings = await generateCategoryMappings(processCategories, similarityThreshold);
      return NextResponse.json({ 
        mappings,
        processedCount: processCategories.length,
        totalCount: categories.length
      });
    } catch (mappingError) {
      console.error("Error in generateCategoryMappings:", mappingError);
      return NextResponse.json(
        { 
          error: "Failed to generate category mappings",
          message: mappingError instanceof Error ? mappingError.message : "Unknown error"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unhandled error in category mapping endpoint:", error);
    return NextResponse.json(
      { 
        error: "Server error processing request",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to update all restaurants with the provided mappings
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { mappings } = await req.json() as { mappings: CategoryMapping[] };
    
    if (!Array.isArray(mappings)) {
      return NextResponse.json(
        { error: "Invalid mappings array" },
        { status: 400 }
      );
    }
    
    await updateAllRestaurantsInterests(mappings);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating restaurant interests:", error);
    return NextResponse.json(
      { error: "Failed to update restaurant interests" },
      { status: 500 }
    );
  }
}