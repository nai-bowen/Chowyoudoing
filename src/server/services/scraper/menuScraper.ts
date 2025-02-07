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
  location: string | null;
  menu: MenuSection[];
}

// Main scraping function
export async function scrapeMenu(url: string): Promise<Restaurant> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

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
          return text && !reviewPattern.test(text) && !ratingPattern.test(text);
        });

      return details.join(' • ');
    }),

    // Extracting rating correctly (first number-only span)
    rating: await page.$$eval('p span[data-testid="rich-text"]', (elements) => {
      const ratingText = elements.map(el => el.textContent?.trim() ?? '')
        .find(text => /^\d+(\.\d+)?$/.test(text));
      return ratingText ?? 'N/A';
    }),

    // Extracting number of reviews correctly
    num_reviews: await page.$$eval('p span[data-testid="rich-text"]', (elements) => {
      const reviewText = elements.map(el => el.textContent?.trim() ?? '')
        .find(text => text.startsWith('(') && text.endsWith(')')); // Matches review format like "(1,000+)"
      return reviewText ?? '(0)';
    }),

    // Extracting location - Addresses usually contain a number, comma, and words
    location: await page.$$eval('span[data-testid="rich-text"]', (elements) => {
      return elements
        .map(el => el.textContent?.trim() ?? '')
        .find(text => /\d+.*,\s.*[A-Za-z]/.test(text)) ?? 'Unknown';
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
          const description = item.querySelector('div span:not([data-testid="rich-text"])')?.textContent?.trim() ?? '';
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
