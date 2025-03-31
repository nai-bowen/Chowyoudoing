// This script tests transformers.js category mappings for a few sample categories
// Run with: npx ts-node src/scripts/testCategoryMappings.ts

import { enhanceCategory, enhanceInterest, getEmbeddings, cosineSimilarity } from '@/utils/embeddingUtils';

import { PREDEFINED_INTERESTS } from "@/utils/categoryMappingService.client";


// Sample categories to test (can add your own)
const SAMPLE_CATEGORIES = [
  "Belgian Food",
  "Bubble tea",
  "Cakes",
  "Sweets",
  "Coffee & tea",
  "Cuban Food",
  "Cured meat",
  "Custard",
  "Desserts",
  "Hot pot",
  "Ice cream & frozen yogurt",
  "Kids Friendly Food",
  "Macaroni cheese",
  "Matcha",
  "Northeastern Thai Food",
  "Pie",
  "Rolls",
  "Pizza",
  "Italian Restaurant",
  "Sushi Bar",
  "Street Food",
  "Breakfast & Brunch",
  "24 Hours Food"
];

async function testCategoryMappings(): Promise<void> {
  console.log("Testing transformers.js category mappings...\n");
  
  try {
    // Get embeddings for interests
    console.log(`Getting embeddings for ${PREDEFINED_INTERESTS.length} interests...`);
    const enhancedInterests = PREDEFINED_INTERESTS.map(enhanceInterest);
    const interestEmbeddings = await getEmbeddings(enhancedInterests);
    
    // Get embeddings for categories
    console.log(`Getting embeddings for ${SAMPLE_CATEGORIES.length} sample categories...`);
    const enhancedCategories = SAMPLE_CATEGORIES.map(enhanceCategory);
    const categoryEmbeddings = await getEmbeddings(enhancedCategories);
    
    // Calculate similarity matrix
    const results: Array<{
      category: string;
      matches: Array<{ interest: string; similarity: number }>;
    }> = [];
    
    for (let i = 0; i < SAMPLE_CATEGORIES.length; i++) {
      const category = SAMPLE_CATEGORIES[i];
      const categoryEmbedding = categoryEmbeddings[i];
      
      if (!category || !categoryEmbedding) {
        console.warn(`Skipping index ${i} due to missing data.`);
        continue;
      }
      
      const matches = PREDEFINED_INTERESTS.map((interest, j) => ({
        interest,
        similarity: cosineSimilarity(categoryEmbedding, interestEmbeddings[j]!)
      }));
      
      matches.sort((a, b) => b.similarity - a.similarity);
      
      results.push({
        category,
        matches: matches.slice(0, 5)
      });
    }
    
    // Print results
    console.log("\nResults:");
    console.log("========\n");
    
    results.forEach(result => {
      console.log(`Category: "${result.category}"`);
      console.log("Top matches:");
      result.matches.forEach((match, i) => {
        console.log(`  ${i + 1}. ${match.interest} (${match.similarity.toFixed(4)})`);
      });
      console.log("");
    });
    
    // Aggregate matches by threshold
    for (const threshold of [0.7, 0.75, 0.8, 0.85]) {
      console.log(`\nMatches at threshold ${threshold}:`);
      console.log("-------------------------");
      
      results.forEach(result => {
        const matchesAtThreshold = result.matches.filter(m => m.similarity >= threshold);
        console.log(`"${result.category}": ${matchesAtThreshold.map(m => m.interest).join(", ") || "No matches"}`);
      });
    }
    
  } catch (error) {
    console.error("Error testing category mappings:", error);
  }
}

// Run the script
testCategoryMappings()
  .then(() => console.log("Test completed."))
  .catch(e => console.error("Error running test:", e));