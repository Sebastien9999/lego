import * as cheerio from 'cheerio';
import { v5 as uuidv5 } from 'uuid';

/**
 * Parse webpage data response
 * @param  {String} data - html response
 * @return {Array} deals
 */
const parse = data => {
  const $ = cheerio.load(data);

  return $('article')
    .map((i, element) => {
      const $article = $(element);
      
      // Extract title from the link
      const title = $article.find('a[href*="/bons-plans/"]').attr('title') || 
                    $article.find('a[href*="/bons-plans/"]').text().trim();
      
      // Extract link
      const link = $article.find('a[href*="/bons-plans/"]').attr('href');
      
      // Extract price (current price)
      const priceText = $article.find('[class*="price"]').first().text().trim();
      const price = parseFloat(priceText.replace('€', '').replace(',', '.'));
      
      // Extract original price
      const originalPriceText = $article.find('[class*="price"]').eq(1).text().trim();
      const originalPrice = parseFloat(originalPriceText.replace('€', '').replace(',', '.'));
      
      // Extract discount percentage
      const discountText = $article.find('[class*="discount"]').text().trim();
      const discount = parseInt(discountText.replace('%', '').replace('-', ''));
      
      // Extract image
      const photo = $article.find('img').attr('src');
      
      // Extract merchant/store
      const merchant = $article.find('[class*="merchant"]').text().trim() || 
                      $article.find('span').text().match(/Dispo\. chez (.+)/)?.[1] || '';
      
      // Extract temperature (interest/upvotes)
      const temperatureText = $article.find('[class*="temperature"]').text().trim();
      const temperature = parseInt(temperatureText.replace('°', ''));

      return {
        title,
        link: link ? `https://www.dealabs.com${link}` : '',
        price: !isNaN(price) ? price : null,
        originalPrice: !isNaN(originalPrice) ? originalPrice : null,
        discount: !isNaN(discount) ? discount : 0,
        photo,
        merchant,
        temperature: !isNaN(temperature) ? temperature : 0,
        'uuid': uuidv5(link || title, uuidv5.URL)
      };
    })
    .get()
    .filter(deal => deal.title); // Filter out empty deals
};

/**
 * Scrape a given url page
 * @param {String} url - url to parse and scrape
 * @returns {Array|null} array of deals or null if error
 */
const scrape = async url => {
  try {
    const response = await fetch(url);

    if (response.ok) {
      const body = await response.text();
      return parse(body);
    }

    console.error('Response error:', response.status);
    return null;
  } catch (error) {
    console.error('Scrape error:', error);
    return null;
  }
};

export { scrape };
