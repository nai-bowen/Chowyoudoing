import puppeteer from 'puppeteer';

// Interfaces for type definitions
interface MenuItem {
  name: string;
  description: string;
  price: string;
  img_url: string;
  status: string;
}

interface MenuSection {
  category: string;
  items: MenuItem[];
}

interface Restaurant {
  title: string | null;
  detail: string | null;
  rating: string;
  num_reviews: string;
  menu: MenuSection[];
}

// Main scraping function
export async function scrapeMenu(url: string): Promise<Restaurant> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Extract restaurant details
// Extract restaurant details
const restaurant: Restaurant = {
  title: await page.$eval('h1', el => el.textContent?.trim() ?? ''),

  // Extracting details like "Wings • American • Fast food"
  detail: await page.$$eval('p span[data-testid="rich-text"]', (elements) => {
    const details = elements
      .map(el => el.textContent?.trim() ?? '')
      .filter(text => {
        const reviewPattern = /\(\d+,?\d*\)/;
        const ratingPattern = /^\d+(\.\d+)?$/;
  
        // Exclude text that matches review or rating patterns
        return text && !reviewPattern.exec(text) && !ratingPattern.exec(text);
      });
  
    return details.join(' • ');
  }),
  

  // Extracting rating like "4.3"
  rating: await page.$eval('p span[data-testid="rich-text"]', el => {
    const ratingText = el.textContent?.trim() ?? 'N/A';
    return /^\d+(\.\d+)?$/.test(ratingText) ? ratingText : 'N/A';
  }),

  // Extracting number of reviews like "(1,000+)"
  num_reviews: await page.$$eval('p span[data-testid="rich-text"]', (elements) => {
    const reviewText = elements.find(el => el.textContent?.includes('('));
    return reviewText?.textContent?.trim() ?? '(0)';
  }),

  menu: [],
};


  // Extract menu categories and items
  const menuSections = await page.$$eval('ul > li', (sections) => {
    return sections
      .map((section) => {
        const category = section.querySelector('h2, h3')?.textContent?.trim() ?? '';
  
        const items = Array.from(section.querySelectorAll('ul > li')).map(item => {
          const name = item.querySelector('span[data-testid="rich-text"]')?.textContent?.trim() ?? '';
  
          // Updated description selector to capture more cases
          const description = item.querySelector('div span:not([data-testid="rich-text"])')?.textContent?.trim() ?? '';
  
          // Extract price using data-testid="rich-text" but ensure it's a currency format
          const price = Array.from(item.querySelectorAll('span[data-testid="rich-text"]'))
            .map(el => el.textContent?.trim() ?? '')
            .find(text => /^£\d+(\.\d{2})?$/.test(text)) ?? '';
  
          const img_url = item.querySelector('img')?.getAttribute('src') ?? '';
  
          const status = item.textContent?.includes('Sold out') ? 'Sold out' : 'In stock';
  
          return { name, description, price, img_url, status };
        });
  
        return { category, items };
      })
      .filter(section => section.category && section.items.length > 0);
  });
  
  restaurant.menu = menuSections;
  

  await browser.close();
  return restaurant;
}
