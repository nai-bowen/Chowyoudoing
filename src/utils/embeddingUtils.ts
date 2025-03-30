import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js for server environment
env.allowLocalModels = false;
env.useBrowserCache = true;
env.allowRemoteModels = true;


// For storing embeddings to avoid redundant computation
const EMBEDDING_CACHE: Record<string, number[]> = {};

// Will be set once pipeline is initialized
let embeddingPipeline: any = null;
let isInitializing = false;
let initError: Error | null = null;

console.log("EmbeddingUtils: Module loaded");

/**
 * Initialize the embedding pipeline
 */
export async function getEmbeddingPipeline() {
  // If already initialized, return it
  if (embeddingPipeline !== null) {
    return embeddingPipeline;
  }

  // If initialization is in progress, wait for it
  if (isInitializing) {
    console.log("EmbeddingUtils: Waiting for existing initialization to complete");
    // Wait for initialization to complete
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (embeddingPipeline !== null || initError !== null) {
        break;
      }
    }
    
    if (embeddingPipeline !== null) {
      return embeddingPipeline;
    }
    
    if (initError !== null) {
      throw initError;
    }
    
    throw new Error("Timed out waiting for model initialization");
  }
  
  try {
    isInitializing = true;
    console.log("EmbeddingUtils: Starting model initialization");
    
    // Use the smallest, most efficient model possible
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      {
        revision: 'main',
        quantized: true,  // Use quantized model for better performance
        progress_callback: (progress: any) => {
          console.log(`Model loading progress: ${Math.round(progress.progress * 100)}%`);
        }
      }
    );
    
    console.log("EmbeddingUtils: Model initialized successfully");
    return embeddingPipeline;
  } catch (error) {
    console.error("EmbeddingUtils: Error initializing model:", error);
    initError = error instanceof Error ? error : new Error(String(error));
    throw error;
  } finally {
    isInitializing = false;
  }
}

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
 * Creates a simple fallback embedding
 */
function createFallbackEmbedding(text: string): number[] {
  console.log(`EmbeddingUtils: Creating fallback embedding for: ${text}`);
  // For all-MiniLM-L6-v2, the embedding size is 384
  const embeddingSize = 384;
  const embedding = new Array(embeddingSize).fill(0);
  
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
  
  // Normalize to unit length
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + (val * val), 0));
  return embedding.map(val => magnitude > 0 ? (val || 0) / magnitude : 0);
}

/**
 * Get embeddings with caching and fallback mechanism
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return [];
  }
  
  console.log(`EmbeddingUtils: Getting embeddings for ${texts.length} texts`);
  
  // Check cache first
  const results: number[][] = new Array(texts.length);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];
  
  texts.forEach((text, index) => {
    if (text && EMBEDDING_CACHE[text]) {
      console.log(`EmbeddingUtils: Cache hit for text: ${text.substring(0, 30)}...`);
      results[index] = EMBEDDING_CACHE[text];
    } else {
      uncachedIndices.push(index);
      uncachedTexts.push(text);
    }
  });
  
  // If everything is cached, return immediately
  if (uncachedTexts.length === 0) {
    console.log("EmbeddingUtils: All texts were cached");
    return results;
  }
  
  // Log uncached texts (first few chars only to keep logs readable)
  console.log(`EmbeddingUtils: Getting embeddings for ${uncachedTexts.length} uncached texts`);
  uncachedTexts.forEach((text, idx) => {
    console.log(`  [${idx}]: ${text.substring(0, 30)}...`);
  });
  
  // Try to get embeddings using the model
  let usedFallback = false;
  
  try {
    // Get the pipeline
    let pipeline;
    try {
      console.log("EmbeddingUtils: Initializing embedding pipeline");
      pipeline = await getEmbeddingPipeline();
      console.log("EmbeddingUtils: Pipeline initialization successful");
    } catch (error) {
      console.error("EmbeddingUtils: Failed to initialize pipeline:", error);
      usedFallback = true;
      throw error; // Re-throw to be handled by the outer try-catch
    }
    
    // Process in very small batches to avoid memory issues
    const batchSize = 1; // Process one at a time to isolate issues
    
    for (let i = 0; i < uncachedTexts.length; i += batchSize) {
      const batch = uncachedTexts.slice(i, i + batchSize);
      const batchIndices = uncachedIndices.slice(i, i + batchSize);
      
      console.log(`EmbeddingUtils: Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uncachedTexts.length / batchSize)}`);
      
      try {
        // Process texts one by one to isolate issues
        for (let j = 0; j < batch.length; j++) {
          const text = batch[j];
          const originalIndex = batchIndices[j];
      
          if (!text || typeof originalIndex !== 'number') continue;
      
          console.log(`EmbeddingUtils: Getting embedding for text: ${text.substring(0, 30)}...`);
      
          const output = await pipeline(text, { pooling: 'mean' });
          const embedding = Array.from(output.data || output) as number[];
      
          if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
            console.warn(`EmbeddingUtils: Empty embedding result for text: ${text.substring(0, 30)}...`);
            const fallbackEmbed = createFallbackEmbedding(text);
            EMBEDDING_CACHE[text] = fallbackEmbed;
            results[originalIndex] = fallbackEmbed;
          } else {
            console.log(`EmbeddingUtils: Got embedding with ${embedding.length} dimensions`);
            EMBEDDING_CACHE[text] = embedding;
            results[originalIndex] = embedding;
          }
        }
      } catch (batchError) {
        console.error(`EmbeddingUtils: Error processing batch:`, batchError);
      
        // Use fallback for this batch
        for (let j = 0; j < batch.length; j++) {
          const text = batch[j];
          const originalIndex = batchIndices[j];
      
          if (!text || typeof originalIndex !== 'number') continue;
      
          console.log(`EmbeddingUtils: Using fallback for text: ${text.substring(0, 30)}...`);
          const fallbackEmbed = createFallbackEmbedding(text);
          EMBEDDING_CACHE[text] = fallbackEmbed;
          results[originalIndex] = fallbackEmbed;
        }
      }
      
    }
  } catch (error) {
    console.error("EmbeddingUtils: Error in getEmbeddings:", error);
    
    // If the error was in pipeline initialization, we'll use fallback for all uncached texts
    if (usedFallback) {
      console.log("EmbeddingUtils: Using fallback for all uncached texts due to pipeline initialization failure");
      
      uncachedTexts.forEach((text, idx) => {
        if (idx < uncachedIndices.length) {
          const originalIndex = uncachedIndices[idx];
          const fallbackEmbed = createFallbackEmbedding(text);
          if (typeof originalIndex === 'number') {
            EMBEDDING_CACHE[text] = fallbackEmbed;
            results[originalIndex] = fallbackEmbed;
          }
        }
        
      });
    }
  }
  
  // Ensure all results are defined
  for (let i = 0; i < results.length; i++) {
    if (!results[i]) {
      console.warn(`EmbeddingUtils: No embedding for index ${i}, using fallback`);
      results[i] = createFallbackEmbedding(texts[i] || "");
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