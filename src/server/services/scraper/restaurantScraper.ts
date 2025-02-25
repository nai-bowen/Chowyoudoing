import puppeteer from 'puppeteer';

export async function scrapeRestaurants(cityUrl: string): Promise<{ url: string; category: string }[]> {
    console.log(`🚀 Starting restaurant scraping for city: ${cityUrl}`);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(cityUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Extract category links
    const categoryLinks = await page.$$eval('a[data-test]', links =>
        links
            .filter(link => link.getAttribute('href')?.startsWith('/gb/category/'))
            .map(link => ({
                url: link.getAttribute('href') ?? '',
                category: link.textContent?.trim() ?? 'Unknown'
            }))
    );

    console.log(`🔍 Found ${categoryLinks.length} category links`);

    await page.close(); // Free memory

    const uniqueCategoryLinks = [...new Map(categoryLinks.map(item => [item.url, item])).values()];
    console.log(`📌 Processing ${uniqueCategoryLinks.length} unique category links`);

    const restaurantCategoryMap = new Map<string, Set<string>>();

    for (const { url: categoryUrl, category } of uniqueCategoryLinks) {
        try {
            console.log(`🌐 Navigating to category page: ${category} (${categoryUrl})`);
            const categoryPage = await browser.newPage();
            await categoryPage.goto(`https://www.ubereats.com${categoryUrl}`, { waitUntil: 'networkidle2', timeout: 60000 });

            const urls = await categoryPage.$$eval(
                'a[data-testid="store-card"]',
                (links, categoryName) =>
                    links.map(link => ({
                        url: link.getAttribute('href') ?? '',
                        category: categoryName
                    })),
                category // Pass category explicitly
            );

            console.log(`📍 Found ${urls.length} restaurants under ${category}`);

            for (const { url, category } of urls) {
                if (!restaurantCategoryMap.has(url)) {
                    restaurantCategoryMap.set(url, new Set());
                }
                restaurantCategoryMap.get(url)?.add(category);
            }

            await categoryPage.close();
        } catch (error) {
            console.error(`❌ Error scraping category: ${categoryUrl}`, error);
        }
    }

    await browser.close();
    console.log(`✅ Scraping complete. Found ${restaurantCategoryMap.size} total restaurants.`);

    return Array.from(restaurantCategoryMap.entries()).map(([url, categories]) => ({
        url,
        category: Array.from(categories).join(', ') // Store categories as a comma-separated string
    }));
}
