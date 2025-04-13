/*eslint-disable*/
// Browser-safe version of embedding utilities

// Instead of directly using transformers.js in the browser,
// we'll implement a simpler fallback mechanism

// Define cache for embeddings to avoid redundant computation
const EMBEDDING_CACHE: Record<string, number[]> = {};

// For all-MiniLM-L6-v2, the embedding size is 384
const EMBEDDING_SIZE = 384;

/**
 * Enhances category with context for better semantic matching
 */
export function enhanceCategory(category: string): string {
  return `Food category or restaurant menu section: ${(category || "").trim()}`;
}

/**
 * Enhances interest with context for better semantic matching
 */
export function enhanceInterest(interest: string): string {
  return `Food type, cuisine or meal category: ${(interest || "").trim()}`;
}

/**
 * Creates a simple fallback embedding based on text content
 * This functions as a deterministic hash of the text content
 */
function createEmbedding(text: string): number[] {
  console.log(`Creating embedding for: ${text.substring(0, 30)}...`);
  
  const embedding = new Array(EMBEDDING_SIZE).fill(0);
  
  // Simple character-based embedding
  const normalizedText = text.toLowerCase().trim();
  for (let i = 0; i < normalizedText.length; i++) {
    const charCode = normalizedText.charCodeAt(i);
    const position = charCode % embedding.length;
    embedding[position] = (embedding[position] || 0) + 1;
  }
  
  // Add word-based features
  const words = normalizedText.split(/\W+/).filter(w => w.length > 0);
  words.forEach(word => {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const position = Math.abs(hash) % embedding.length;
    embedding[position] = (embedding[position] || 0) + 2;
  });
  
  // Add some semantic features for food-related terms
  const foodTerms: Record<string, number> = {
    'pizza': 10,
    'burger': 20,
    'steak': 30,
    'fish': 40,
    'chicken': 50,
    'vegetarian': 60,
    'vegan': 70,
    'sushi': 80,
    'italian': 90,
    'chinese': 100,
    'japanese': 110,
    'indian': 120,
    'mexican': 130,
    'breakfast': 140,
    'dessert': 150,
    'drinks': 160,
    'salad': 170,
    'sandwich': 180,
    'pasta': 190,
    'rice': 200
  };
  
  Object.entries(foodTerms).forEach(([term, position]) => {
    if (normalizedText.includes(term)) {
      embedding[position % embedding.length] += 5;
    }
  });
  
  // Normalize to unit length
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + (val * val), 0));
  return embedding.map(val => magnitude > 0 ? (val || 0) / magnitude : 0);
}

/**
 * Get embeddings with caching
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return [];
  }
  
  console.log(`Getting embeddings for ${texts.length} texts`);
  
  // Check cache first
  const results: number[][] = [];
  
  for (const text of texts) {
    if (text) {
      if (EMBEDDING_CACHE[text]) {
        results.push(EMBEDDING_CACHE[text]);
      } else {
        const embedding = createEmbedding(text);
        EMBEDDING_CACHE[text] = embedding;
        results.push(embedding);
      }
    } else {
      // Handle empty text
      results.push(new Array(EMBEDDING_SIZE).fill(0));
    }
  }
  
  return results;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    console.error(`Invalid vectors: vecA length=${vecA?.length}, vecB length=${vecB?.length}`);
    throw new Error("Vectors must be valid arrays of the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const valueA = vecA[i] || 0;
    const valueB = vecB[i] || 0;
    
    dotProduct += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}