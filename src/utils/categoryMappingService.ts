/*eslint-disable*/

import { PrismaClient } from '@prisma/client';
import { enhanceCategory, enhanceInterest, getEmbeddings, cosineSimilarity } from './embeddingUtils';

const prisma = new PrismaClient();

// Predefined interests that we want to map categories to
export const PREDEFINED_INTERESTS: string[] = [
  "Pizza", "Japanese", "Chinese", "Fish & Chips", "Italian",
  "Greek", "Caribbean", "American", "Sushi", "Sandwiches",
  "Dessert", "Vegan/Vegetarian", "Lebanese", "Mexican",
  "Burgers", "Indian", "Mediterranean", "Steak", "Breakfast",
  "Salads", "Tacos", "Chicken", "Boba/Juice"
];

export interface CategoryMapping {
  category: string;
  interests: string[];
  similarityScores?: Record<string, number>;
}

/**
 * Function to fetch all unique categories from restaurants
 */
export async function getAllUniqueCategories(): Promise<string[]> {
  try {
    const restaurants = await prisma.restaurant.findMany({
      select: {
        category: true
      }
    });
    
    // Extract and flatten all categories
    const allCategories = restaurants.flatMap(restaurant => 
      Array.isArray(restaurant.category) ? restaurant.category : []
    );
    
    // Remove duplicates
    const uniqueCategories = [...new Set(allCategories)];
    
    return uniqueCategories;
  } catch (error) {
    console.error("Error fetching unique categories:", error);
    throw error;
  }
}

/**
 * Direct mapping based on keywords for more accurate matching
 */
function getDirectMappings(category: string): string[] {
  if (!category) return [];
  
  const lowerCategory = category.toLowerCase().trim();
  const directMatches: string[] = [];
  
  // Skip 24 hours food category as specified - improved detection
  if (lowerCategory.includes("24 hour") || 
      lowerCategory.includes("24hours") || 
      lowerCategory === "24 hours food" || 
      lowerCategory.includes("24/7")) {
    return [];
  }
  
  // Special case for exact "Pizza" category
  if (category === "Pizza") {
    return ["Pizza", "American"];
  }
  
  // Direct keyword mappings based on requirements
  const keywordMap: Record<string, string[]> = {
    "pizza": ["Pizza", "American"],
    "pizz": ["Pizza", "American"], // Handle variations
    "taco": ["Tacos", "Mexican"],
    "burger": ["Burgers", "American"],
    "steak": ["Steak"],
    "beef": ["Steak", "Sandwiches"],
    "meat": ["Steak", "Sandwiches"],
    "bacon": ["American", "Breakfast"],
    "breakfast": ["Breakfast"],
    "brunch": ["Breakfast"],
    "salad": ["Salads", "Vegan/Vegetarian"],
    "veg": ["Salads", "Vegan/Vegetarian"],
    "sushi": ["Sushi", "Japanese"],
    "japanese": ["Japanese", "Sushi"],
    "chinese": ["Chinese"],
    "asian": ["Japanese", "Chinese", "Sushi"],
    "korean": ["Japanese", "Asian"],
    "sandwich": ["Sandwiches"],
    "mediterr": ["Mediterranean"],
    // Limiting Greek to only Greek, not automatically Mediterranean
    "greek": ["Greek"],
    "italian": ["Italian", "Pizza"],
    "indian": ["Indian"],
    "curry": ["Indian"],
    "dessert": ["Dessert"],
    "sweet": ["Dessert"],
    "cake": ["Dessert"],
    "ice cream": ["Dessert"],
    "vegan": ["Vegan/Vegetarian"],
    "vegetarian": ["Vegan/Vegetarian"],
    "chicken": ["Chicken"],
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

/**
 * Function to generate embeddings for all interests
 */
export async function getInterestEmbeddings(): Promise<{ interest: string; embedding: number[] }[]> {
  const enhancedInterests = PREDEFINED_INTERESTS.map(interest => enhanceInterest(interest));
  
  // Use the batch embedding function to get all embeddings at once
  const embeddings = await getEmbeddings(enhancedInterests);
  
  const result: { interest: string; embedding: number[] }[] = [];
  
  // Process the results
  embeddings.forEach((embedding, index) => {
    if (index >= 0 && index < PREDEFINED_INTERESTS.length && embedding && Array.isArray(embedding)) {
      const originalInterest = PREDEFINED_INTERESTS[index];
      if (typeof originalInterest === 'string') {
        result.push({ interest: originalInterest, embedding });
      }
      
    }
  });
  
  return result;
}

/**
 * Function to find matching interests for a category embedding
 */
export function findMatchingInterests(
  categoryEmbedding: number[],
  interestEmbeddings: { interest: string; embedding: number[] }[],
  threshold: number = 0.65,
  maxMatches: number = 5
): string[] {
  // Validate inputs
  if (!categoryEmbedding || !Array.isArray(categoryEmbedding) || categoryEmbedding.length === 0) {
    return [];
  }
  
  if (!interestEmbeddings || !Array.isArray(interestEmbeddings) || interestEmbeddings.length === 0) {
    return [];
  }
  
  // Filter out invalid embeddings
  const validInterestEmbeddings = interestEmbeddings.filter(
    item => item && item.interest && item.embedding && Array.isArray(item.embedding) && item.embedding.length > 0
  );
  
  if (validInterestEmbeddings.length === 0) {
    return [];
  }
  
  try {
    const scores = validInterestEmbeddings.map(item => ({
      interest: item.interest,
      score: cosineSimilarity(categoryEmbedding, item.embedding)
    }));
    
    // Sort by similarity score (highest first)
    scores.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Filter by threshold and limit results
    return scores
      .filter(item => (item.score || 0) >= threshold)
      .slice(0, maxMatches)
      .map(item => item.interest);
  } catch (error) {
    console.error("Error finding matching interests:", error);
    return [];
  }
}

/**
 * Generate category-to-interest mappings using both direct matching and embeddings
 */
export async function generateCategoryMappings(
  categories: string[],
  similarityThreshold: number = 0.86
): Promise<CategoryMapping[]> {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return [];
  }

  // Get embeddings for all interests
  const interestEmbeddings = await getInterestEmbeddings();
  
  if (!interestEmbeddings || interestEmbeddings.length === 0) {
    console.warn("No valid interest embeddings generated");
    return categories.map(category => ({ category, interests: [] }));
  }
  
  // Create enhanced categories
  const enhancedCategories = categories.filter(Boolean).map(cat => enhanceCategory(cat));
  
  // Get embeddings for all categories at once
  const categoryEmbeddings = await getEmbeddings(enhancedCategories);
  
  const mappings: CategoryMapping[] = [];
  
  // Process each category with its embedding
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    if (!category) continue;
    
    try {
      // First try direct keyword matching for more accurate results
      const directMatches = getDirectMappings(category);
      
      // Then supplement with embedding-based matching
      const categoryEmbedding = categoryEmbeddings[i];
      
      let embeddingMatches: string[] = [];
      let similarityScores: Record<string, number> = {};
      
      if (categoryEmbedding && Array.isArray(categoryEmbedding) && categoryEmbedding.length > 0) {
        // Calculate similarity for all interests
        const scores = interestEmbeddings.map(item => {
          if (item && item.interest && item.embedding) {
            try {
              let similarity = cosineSimilarity(categoryEmbedding, item.embedding);
              
              // Apply a penalty to Mediterranean unless it's a direct match
              if (item.interest === "Mediterranean" && 
                  !directMatches.includes("Mediterranean") &&
                  !category.toLowerCase().includes("mediterranean") &&
                  !category.toLowerCase().includes("greek")) {
                similarity = similarity * 0.85; // Apply a 15% penalty
              }
              
              // Apply a penalty to Tacos unless it's a direct match
              if (item.interest === "Tacos" && 
                  !directMatches.includes("Tacos") &&
                  !category.toLowerCase().includes("taco") &&
                  !category.toLowerCase().includes("mexican")) {
                similarity = similarity * 0.85; // Apply a 15% penalty
              }
              
              // Special case for Pizza
              if (category === "Pizza" && item.interest === "Pizza") {
                similarity = 1.0; // Perfect match
              }
              else if ((category.toLowerCase().includes("pizza") || 
                  category.toLowerCase().includes("pizz")) && 
                  item.interest === "Pizza") {
                similarity = Math.max(similarity, 0.98);
              }
              
              similarityScores[item.interest] = parseFloat(similarity.toFixed(3));
              return { interest: item.interest, score: similarity };
            } catch (error) {
              return { interest: item.interest, score: 0 };
            }
          }
          return { interest: item.interest || "Unknown", score: 0 };
        });
        
        // Sort by similarity score (highest first)
        scores.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // Get matches based on threshold
        embeddingMatches = scores
          .filter(item => (item.score || 0) >= similarityThreshold)
          .map(item => item.interest);
      }
      
      // Combine direct and embedding matches, removing duplicates
      const combinedMatches = [...new Set([...directMatches, ...embeddingMatches])];
      
      // Limit to max 5 categories as specified
      const finalMatches = combinedMatches.slice(0, 5);
      
      // We've already calculated similarity scores above, just need to ensure direct matches
      // have high scores
      
      // Make sure direct matches have high scores
      directMatches.forEach(match => {
        // Set a high similarity score for direct matches to prioritize them
        similarityScores[match] = Math.max(similarityScores[match] || 0, 0.95);
      });
      
      // Sort interests by similarity score when available
      let sortedMatches = [...finalMatches];
      if (Object.keys(similarityScores).length > 0) {
        sortedMatches.sort((a, b) => (similarityScores[b] || 0) - (similarityScores[a] || 0));
      }
      
      // Make sure Pizza is prioritized if it appears in the matches
      if (sortedMatches.includes("Pizza")) {
        sortedMatches = [
          "Pizza",
          ...sortedMatches.filter(interest => interest !== "Pizza")
        ];
      }
      
      // Limit to top 5
      const finalTopMatches = sortedMatches.slice(0, 5);
      
      mappings.push({
        category,
        interests: finalTopMatches,
        similarityScores
      });
    } catch (error) {
      console.error(`Error processing category "${category}":`, error);
      mappings.push({ category, interests: [] });
    }
  }
  
  return mappings;
}

/**
 * Update a single restaurant's interests based on its categories
 */
export async function updateRestaurantInterests(
  restaurantId: string, 
  categoryMappings: CategoryMapping[]
): Promise<void> {
  if (!restaurantId || !categoryMappings || !Array.isArray(categoryMappings)) {
    console.warn("Invalid inputs to updateRestaurantInterests");
    return;
  }
  
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { category: true }
    });
    
    if (!restaurant || !restaurant.category) {
      console.warn(`Restaurant ${restaurantId} not found or has no categories`);
      return;
    }
    
    // Determine interests based on categories
    const interests = new Set<string>();
    
    // Create a map for faster lookups
    const mappingMap: Record<string, string[]> = {};
    categoryMappings.forEach(mapping => {
      if (mapping && mapping.category && mapping.interests) {
        mappingMap[mapping.category] = mapping.interests;
      }
    });
    
    restaurant.category.forEach(category => {
      if (category && mappingMap[category]) {
        mappingMap[category].forEach(interest => {
          if (interest) {
            interests.add(interest);
          }
        });
      }
    });
    
    // Update restaurant with new interests
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { interests: Array.from(interests) }
    });
  } catch (error) {
    console.error(`Error updating restaurant ${restaurantId} interests:`, error);
    throw error;
  }
}

/**
 * Update all restaurants' interests
 */
export async function updateAllRestaurantsInterests(
  categoryMappings: CategoryMapping[]
): Promise<void> {
  if (!categoryMappings || !Array.isArray(categoryMappings)) {
    console.warn("Invalid category mappings provided");
    return;
  }
  
  try {
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        title: true,
        category: true
      }
    });
    
    if (!restaurants || restaurants.length === 0) {
      console.log("No restaurants found to update");
      return;
    }
    
    // Create a map for faster lookups
    const mappingMap: Record<string, string[]> = {};
    categoryMappings.forEach(mapping => {
      if (mapping && mapping.category && Array.isArray(mapping.interests)) {
        mappingMap[mapping.category] = mapping.interests;
      }
    });
    
    console.log(`Updating interests for ${restaurants.length} restaurants...`);
    
    for (const restaurant of restaurants) {
      if (!restaurant || !restaurant.id || !Array.isArray(restaurant.category)) {
        continue;
      }
      
      // Determine interests based on categories
      const interests = new Set<string>();
      
      restaurant.category.forEach(category => {
        if (category && mappingMap[category]) {
          mappingMap[category].forEach(interest => {
            if (interest) {
              interests.add(interest);
            }
          });
        }
      });
      
      const interestsArray = Array.from(interests);
      
      // Log progress
      console.log(`Updating ${restaurant.title || restaurant.id} with interests: ${interestsArray.join(', ') || 'None'}`);
      
      // Update restaurant with new interests
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { interests: interestsArray }
      });
    }
    
    console.log('All restaurants updated successfully!');
  } catch (error) {
    console.error("Error updating all restaurant interests:", error);
    throw error;
  }
}