import { NextRequest, NextResponse } from "next/server";
import { enhanceCategory, enhanceInterest, getEmbeddings, cosineSimilarity } from "@/utils/embeddingUtils";

// Predefined interests
const PREDEFINED_INTERESTS = [
  "Pizza", "Japanese", "Chinese", "Fish & Chips", "Italian",
  "Greek", "Caribbean", "American", "Sushi", "Sandwiches",
  "Dessert", "Vegan/Vegetarian", "Lebanese", "Mexican",
  "Burgers", "Indian", "Mediterranean", "Steak", "Breakfast",
  "Salads", "Tacos", "Chicken", "Boba/Juice"
];

// Simplified version for testing only
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
    const maxBatchSize = 10;
    const processCategories = categories.slice(0, maxBatchSize);
    
    if (processCategories.length < categories.length) {
      console.log(`Processing only ${processCategories.length} of ${categories.length} categories to prevent timeout`);
    }
    
    const similarityThreshold = threshold || 0.75;
    
    // Step 1: Get embeddings for interests
    console.log("Getting interest embeddings...");
    const enhancedInterests = PREDEFINED_INTERESTS.map(enhanceInterest);
    const interestEmbeddings = await getEmbeddings(enhancedInterests);
    
    // Store interest embeddings with their names
    const interestEmbeddingsWithNames = PREDEFINED_INTERESTS.map((interest, index) => ({
      interest,
      embedding: interestEmbeddings[index] || []
    }));
    
    // Step 2: Get embeddings for categories
    console.log("Getting category embeddings...");
    const enhancedCategories = processCategories.map(enhanceCategory);
    const categoryEmbeddings = await getEmbeddings(enhancedCategories);
    
    // Step 3: Calculate similarities and find matches
    console.log("Calculating similarities...");
    const results = [];
    
    for (let i = 0; i < processCategories.length; i++) {
      const category = processCategories[i];
      const categoryEmbedding = categoryEmbeddings[i];
      
      if (!category || !categoryEmbedding) {
        console.warn(`Skipping category at index ${i} due to missing data`);
        continue;
      }
      
      // Calculate similarity scores with all interests
      const scores = PREDEFINED_INTERESTS.map((interest, j) => {
        try {
          const interestEmbedding = interestEmbeddings[j];
          if (!interestEmbedding) return { interest, similarity: 0 };
          
          const similarity = cosineSimilarity(categoryEmbedding, interestEmbedding);
          return { interest, similarity };
        } catch (error) {
          console.warn(`Error calculating similarity for "${category}" and "${interest}":`, error);
          return { interest, similarity: 0 };
        }
      });
      
      // Sort scores by similarity (highest first)
      scores.sort((a, b) => b.similarity - a.similarity);
      
      // Get matches based on threshold
      const matchedInterests = scores
        .filter(score => score.similarity >= similarityThreshold)
        .map(score => score.interest);
      
      // Store the results
      results.push({
        category,
        topMatches: scores.slice(0, 5),
        mappedInterests: matchedInterests,
        scores: scores
      });
    }
    
    return NextResponse.json({ 
      success: true,
      results,
      processedCount: results.length,
      totalCount: categories.length
    });
  } catch (error) {
    console.error("Error in category test API:", error);
    return NextResponse.json(
      { 
        error: "Failed to process categories",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}