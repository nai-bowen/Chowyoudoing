import fs from 'fs';
import { scrapeRestaurants } from './restaurantScraper';
import { scrapeMenu } from './menuScraper';
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

type CityData = Record<string, RestaurantData[]>;


interface UberEatsData {
  cities: CityData[];
}

// Base URL and cities
const baseUrl = 'https://www.ubereats.com/gb/category/';
const cityList = ['london', 'manchester', 'birmingham'];


export async function scrapeUberEatsData(cityUrl: string): Promise<void> {
  console.log(`Starting Uber Eats scraping for city: ${cityUrl}`);

  const restaurantUrls = await scrapeRestaurants(cityUrl);

  for (const url of restaurantUrls) {
      try {
          const fullUrl = `https://www.ubereats.com${url}`;
          await saveScrapedData(fullUrl);
          console.log(`Scraped and saved: ${fullUrl}`);
      } catch (error) {
          console.error(`Failed to scrape menu for ${url}:`, error);
      }
  }

  console.log(`Scraping completed for city: ${cityUrl}`);
}

