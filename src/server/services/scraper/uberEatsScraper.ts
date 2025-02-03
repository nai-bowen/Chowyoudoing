import fs from 'fs';
import { scrapeRestaurants } from './restaurantScraper';
import { scrapeMenu } from './menuScraper';

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

async function scrapeUberEatsData(): Promise<void> {
  const restaurantData: UberEatsData = { cities: [] };

  for (const city of cityList) {
    const restaurantUrls = await scrapeRestaurants(baseUrl, city);
    const cityData: RestaurantData[] = [];

    for (const url of restaurantUrls) {
      try {
        const menuData = await scrapeMenu(`https://www.ubereats.com${url}`);
        cityData.push(menuData);
      } catch (error) {
        console.error(`Failed to scrape menu for ${url}:`, error);
      }
    }

    restaurantData.cities.push({ [city]: cityData });
  }

  fs.writeFileSync('src/data/ubereats_data.json', JSON.stringify(restaurantData, null, 2));
}

void (async () => {
    try {
      await scrapeUberEatsData();
      console.log('Scraping complete!');
    } catch (error) {
      console.error('Error during scraping:', error);
    }
  })();
  
