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
 * Function to generate embeddings for all interests
 */
export async function getInterestEmbeddings(): Promise<{ interest: string; embedding: number[] }[]> {
  const enhancedInterests = PREDEFINED_INTERESTS.map(interest => enhanceInterest(interest || ""));
  
  // Use the batch embedding function to get all embeddings at once
  const embeddings = await getEmbeddings(enhancedInterests);
  
  const result: { interest: string; embedding: number[] }[] = [];
  
  // Process the results
  embeddings.forEach((embedding, index) => {
    if (index >= 0 && index < PREDEFINED_INTERESTS.length && embedding && Array.isArray(embedding)) {
      const originalInterest = PREDEFINED_INTERESTS[index] || "Unknown";
      result.push({ interest: originalInterest, embedding });
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
  maxMatches: number = 3
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
 * Generate category-to-interest mappings using cosine similarity
 */
export async function generateCategoryMappings(
  categories: string[],
  similarityThreshold: number = 0.75
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
      const categoryEmbedding = categoryEmbeddings[i];
      
      if (!categoryEmbedding || !Array.isArray(categoryEmbedding) || categoryEmbedding.length === 0) {
        console.warn(`Invalid embedding for category "${category}"`);
        mappings.push({ category, interests: [] });
        continue;
      }
      
      // Find matching interests
      const matchingInterests = findMatchingInterests(
        categoryEmbedding,
        interestEmbeddings,
        similarityThreshold
      );
      
      // Store similarity scores for debugging/UI
      const similarityScores: Record<string, number> = {};
      interestEmbeddings.forEach(item => {
        if (item && item.interest && item.embedding) {
          try {
            similarityScores[item.interest] = parseFloat(
              cosineSimilarity(categoryEmbedding, item.embedding).toFixed(3)
            );
          } catch (error) {
            similarityScores[item.interest] = 0;
          }
        }
      });
      
      mappings.push({
        category,
        interests: matchingInterests,
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