// src/server/services/scraper/uberEatsScraper.ts

import { scrapeRestaurants } from './restaurantScraper';
import { saveScrapedData } from '@/server/services/scraperService';
import { scrapeMenu } from './menuScraper';

// Type definitions
interface ScrapeRequest {
  url: string;
  widerAreas: string[];
  type: "category" | "restaurant";
}

export async function scrapeUberEatsData(scrapeRequest: ScrapeRequest): Promise<void> {
  const { url, widerAreas = [], type } = scrapeRequest;
  
  // Handle single restaurant scraping
  if (type === "restaurant") {
    await scrapeSingleRestaurant(url, widerAreas);
    return;
  }
  
  // Handle category scraping (multiple restaurants)
  await scrapeRestaurantCategory(url, widerAreas);
}

// Function to scrape a single restaurant
async function scrapeSingleRestaurant(url: string, widerAreas: string[]): Promise<void> {
  console.log(`🚀 Starting scraping for single restaurant: ${url}`);
  
  if (widerAreas.length > 0) {
    console.log(`📍 Wider areas to be added: ${widerAreas.join(', ')}`);
  }
  
  try {
    // Get category from URL if possible
    let categories: string[] = [];
    const urlPathSegments = new URL(url).pathname.split('/');
    const storeSegmentIndex = urlPathSegments.findIndex(segment => segment === 'store');
    
    if (storeSegmentIndex >= 0 && storeSegmentIndex + 2 < urlPathSegments.length) {
      // Try to extract category from URL path
      const potentialCategory = urlPathSegments[storeSegmentIndex + 2];
      if (potentialCategory && !potentialCategory.includes('-')) {
        categories = [potentialCategory];
      }
    }
    
    // Pass the URL and wider areas to the scraper service
    await saveScrapedData({
      url,
      categories,
      widerAreas
    });
    
    console.log(`✅ Successfully scraped and saved restaurant: ${url}`);
    if (widerAreas.length > 0) {
      console.log(`   Wider Areas: ${widerAreas.join(', ')}`);
    }
  } catch (error) {
    console.error(`❌ Failed to scrape single restaurant: ${url}`, error);
    throw error;
  }
}

// Function to scrape multiple restaurants from a category
async function scrapeRestaurantCategory(categoryUrl: string, widerAreas: string[]): Promise<void> {
  console.log(`🚀 Starting Uber Eats category scraping for: ${categoryUrl}`);
  
  if (widerAreas.length > 0) {
    console.log(`📍 Wider areas to be added: ${widerAreas.join(', ')}`);
  }

  const restaurantData = await scrapeRestaurants(categoryUrl);
  console.log(`🔍 Found ${restaurantData.length} restaurants in category`);

  for (const { url, category } of restaurantData) {
    try {
      const fullUrl = `https://www.ubereats.com${url}`;
      
      // Pass wider areas to the scraper service
      await saveScrapedData({
        url: fullUrl,
        categories: category.split(', '),
        widerAreas
      });
      
      console.log(`✅ Scraped and saved: ${fullUrl}`);
      console.log(`   Categories: ${category}`);
      if (widerAreas.length > 0) {
        console.log(`   Wider Areas: ${widerAreas.join(', ')}`);
      }
    } catch (error) {
      console.error(`❌ Failed to scrape menu for ${url}:`, error);
    }
  }

  console.log(`✅ Category scraping completed for: ${categoryUrl}`);
}