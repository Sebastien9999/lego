import { scrape } from './websites/dealsLab.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Fetch Lego deals from dealabs and save to JSON file
 */
const fetchAndSaveDeals = async () => {
  const url = 'https://www.dealabs.com/groupe/lego';
  
  console.log(`Scraping deals from ${url}...`);
  
  const deals = await scrape(url);
  
  if (deals && deals.length > 0) {
    const outputPath = resolve('./data/deals.json');
    const data = {
      timestamp: new Date().toISOString(),
      source: url,
      count: deals.length,
      deals: deals
    };
    
    writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✓ Saved ${deals.length} deals to ${outputPath}`);
    console.log('\nSample deal:');
    console.log(JSON.stringify(deals[0], null, 2));
  } else {
    console.error('Failed to scrape deals or no deals found');
  }
};

fetchAndSaveDeals().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
