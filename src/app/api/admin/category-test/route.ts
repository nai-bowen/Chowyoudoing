/*eslint-disable*/
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

/**
* Direct mapping based on keywords for more accurate matching
*/
function getDirectMappings(category: string): string[] {
if (!category) return [];

// Debug logging
console.log(`Checking direct mappings for category: "${category}"`);

const lowerCategory = category.toLowerCase().trim();
const directMatches: string[] = [];

// Skip 24 hours food category as specified - improved detection
if (lowerCategory.includes("24 hour") || 
  lowerCategory.includes("24hours") || 
  lowerCategory === "24 hours food" || 
  lowerCategory.includes("24/7")) {
console.log(`Skipping 24 hours food category: "${category}"`);
return [];
}

// Special case for exact "Pizza" category
if (category === "Pizza") {
console.log("EXACT PIZZA MATCH DETECTED!");
return ["Pizza", "American"];
}

// Direct keyword mappings based on requirements
const keywordMap: Record<string, string[]> = {
"pizza": ["Pizza", "American"],
"pizz": ["Pizza", "American"], // Handle variations
"taco": ["Tacos", "Mexican"],
"bacon": ["American", "Breakfast"],
"bbq": ["American", "Steak"],
"beef": ["Steak", "Sandwiches"],
"bar food": ["American"],
"wings": ["Chicken", "American"],
"american": ["American"],
"southern": ["American"],
"tex mex": ["Mexican", "Tacos"],
"fish & chips": ["Fish & Chips"],
"dessert": ["Dessert"],
"sweets": ["Dessert"],
"doughnuts": ["Dessert"],
"custard": ["Dessert"],
"pie": ["Dessert", "American"],
"korean": ["Japanese", "Sushi"],
"hot pot": ["Chinese"],
"chicken": ["Chicken"],
"wraps": ["Sandwiches"],
"deli": ["Sandwiches"],
"rolls": ["Sandwiches"],
"western food": ["American"],
"street food": ["American"],
"fast food": ["American", "Burgers"],
"pub": ["American", "Fish & Chips"],
"gourmet": ["American"],
"comfort food": ["American"],
"burger": ["Burgers", "American"],
"steak": ["Steak"],
"meat": ["Steak", "Sandwiches"],
"breakfast": ["Breakfast"],
"brunch": ["Breakfast"],
"salad": ["Salads", "Vegan/Vegetarian"],
"veg": ["Salads", "Vegan/Vegetarian"],
"sushi": ["Sushi", "Japanese"],
"japanese": ["Japanese", "Sushi"],
"chinese": ["Chinese"],
"asian": ["Japanese", "Chinese", "Sushi"],
"sandwich": ["Sandwiches"],
"mediterr": ["Mediterranean"],
// Limiting Greek to only Greek, not automatically Mediterranean
"greek": ["Greek"],
"italian": ["Italian", "Pizza"],
"indian": ["Indian"],
"curry": ["Indian"],
"sweet": ["Dessert"],
"cake": ["Dessert"],
"ice cream": ["Dessert"],
"vegan": ["Vegan/Vegetarian"],
"vegetarian": ["Vegan/Vegetarian"],
"fish": ["Fish & Chips"],
"chips": ["Fish & Chips"],
"juice": ["Boba/Juice"],
"boba": ["Boba/Juice"],
"tea": ["Boba/Juice"],
"lebanese": ["Lebanese"],
"caribbean": ["Caribbean"],
"mexican": ["Mexican", "Tacos"],
"pepperoni": ["Pizza"]
};

// Check for keyword matches
Object.entries(keywordMap).forEach(([keyword, interests]) => {
if (lowerCategory.includes(keyword)) {
  interests.forEach(interest => {
    if (!directMatches.includes(interest)) {
      directMatches.push(interest);
    }
  });
}
});

// Look for direct matches with predefined interests (handles partial matches)
PREDEFINED_INTERESTS.forEach(interest => {
if (lowerCategory.includes(interest.toLowerCase())) {
  if (!directMatches.includes(interest)) {
    directMatches.push(interest);
  }
}
});

return directMatches;
}

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
// Track frequency of all interests for top 5 calculation
const interestFrequencyCounter: Record<string, number> = {};

for (let i = 0; i < processCategories.length; i++) {
  const category = processCategories[i];
  const categoryEmbedding = categoryEmbeddings[i];
  
  if (!category || !categoryEmbedding) {
    console.warn(`Skipping category at index ${i} due to missing data`);
    continue;
  }
  
  // First try direct keyword matching for more accurate results
  const directMatches = getDirectMappings(category);
  
  // Calculate similarity scores with all interests
  const scores = PREDEFINED_INTERESTS.map((interest, j) => {
    try {
      const interestEmbedding = interestEmbeddings[j];
      if (!interestEmbedding) return { interest, similarity: 0 };
      
      let similarity = cosineSimilarity(categoryEmbedding, interestEmbedding);
      
      // Boost similarity for direct matches
      if (directMatches.includes(interest)) {
        similarity = Math.max(similarity, 0.95); // Ensure direct matches have high similarity
        console.log(`Boosted similarity for direct match: "${category}" -> "${interest}" (0.95)`);
      }
      
      // Special case handling for important categories
      // Extra special case for Pizza with priority override
      if (category === "Pizza" && interest === "Pizza") {
        similarity = 1.0; // Perfect match
        console.log(`EXACT PIZZA MATCH: "${category}" -> "Pizza" (1.0)`);
      }
      else if ((category.toLowerCase().includes("pizza") || 
          category.toLowerCase().includes("pizz")) && 
          interest === "Pizza") {
        similarity = Math.max(similarity, 0.98);
        console.log(`Pizza special case: "${category}" -> "Pizza" (0.98)`);
      }
      
      // Apply a penalty to Mediterranean unless it's a direct match
      // This prevents it from being over-matched based on embedding similarities
      if (interest === "Mediterranean" && 
          !directMatches.includes("Mediterranean") &&
          !category.toLowerCase().includes("mediterranean") &&
          !category.toLowerCase().includes("greek") &&
          !category.toLowerCase().includes("lebanese")) {
        
        similarity = similarity * 0.85; // Apply a 15% penalty
        console.log(`Applied Mediterranean penalty for "${category}": ${similarity.toFixed(3)}`);
      }
      
      return { interest, similarity };
    } catch (error) {
      console.warn(`Error calculating similarity for "${category}" and "${interest}":`, error);
      return { interest, similarity: 0 };
    }
  });
  
  // Sort scores by similarity (highest first)
  scores.sort((a, b) => b.similarity - a.similarity);
  
  // Skip processing if this is a "24 hours food" category
  const is24HoursFood = 
    category.toLowerCase().includes("24 hour") || 
    category.toLowerCase().includes("24hours") || 
    category.toLowerCase() === "24 hours food" ||
    category.toLowerCase().includes("24/7");
  
  // Get matches based on threshold
  let matchedInterests: string[] = [];
  
  if (is24HoursFood) {
    console.log(`Skipping 24 hours food category in final results: "${category}"`);
    matchedInterests = []; // Empty matches for 24 hours food
  } else {
    matchedInterests = scores
      .filter(score => score.similarity >= similarityThreshold)
      .map(score => score.interest)
      .slice(0, 5); // Limit to 5 matches maximum
      
    console.log(`Matched interests for "${category}": ${matchedInterests.join(', ') || 'None'}`);
    
    // Count frequency of each interest for top 5 calculation
    matchedInterests.forEach(interest => {
      interestFrequencyCounter[interest] = (interestFrequencyCounter[interest] || 0) + 1;
    });
  }
  
  // For top matches, we want to prioritize direct matches first
  let topMatches = scores.slice(0, 5);
  
  // Special handling for exact "Pizza" category
  if (category === "Pizza") {
    // Ensure Pizza is in the results with highest similarity
    const pizzaMatch = { interest: "Pizza", similarity: 1.0 };
    const americanMatch = { interest: "American", similarity: 0.95 };
    
    // Replace existing matches if needed
    topMatches = [
      pizzaMatch,
      americanMatch,
      ...topMatches.filter(match => 
        match.interest !== "Pizza" && match.interest !== "American"
      )
    ].slice(0, 5);
    
    console.log("EXACT PIZZA CATEGORY - Ensured Pizza is in top matches:", 
      topMatches.map(m => m.interest).join(", "));
  }
  
  // Store the results
  results.push({
    category,
    topMatches: topMatches,
    mappedInterests: matchedInterests,
    scores: scores,
    directMatches: directMatches // Include direct matches for transparency
  });
}

// Calculate top 5 most frequent interests
const topInterests = Object.entries(interestFrequencyCounter)
  .sort((a, b) => b[1] - a[1]) // Sort by frequency (highest first)
  .slice(0, 5)  // Get top 5
  .map(([interest, count]) => ({
    interest,
    count,
    percentage: Math.round((count / results.length) * 100) // Calculate percentage
  }));

console.log("Top 5 interests:", topInterests.map(i => `${i.interest} (${i.count})`).join(', '));

return NextResponse.json({ 
  success: true,
  topInterests,
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