
import { scrapeRestaurants } from './restaurantScraper';
import { saveScrapedData } from '@/server/services/scraperService';


// Type definitions
interface RestaurantData {
    title: string | null;
    detail: string | null;
    rating: string;
  num_reviews: string;
  menu: {
    category: string;
    items: {
      name: string;
      description: string;
      price: string;
      img_url: string;
      status: string;
    }[];
  }[];
}


export async function scrapeUberEatsData(cityUrl: string): Promise<void> {
  console.log(`🚀 Starting Uber Eats scraping for city: ${cityUrl}`);

  const restaurantData = await scrapeRestaurants(cityUrl);

  for (const { url, category } of restaurantData) {
      try {
          const fullUrl = `https://www.ubereats.com${url}`;
          await saveScrapedData(fullUrl, category);
          console.log(`✅ Scraped and saved: ${fullUrl} under categories: ${category}`);
      } catch (error) {
          console.error(`❌ Failed to scrape menu for ${url}:`, error);
      }
  }

  console.log(`✅ Scraping completed for city: ${cityUrl}`);
}
