// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectFilters = document.querySelector('#filters-select');
const selectSort = document.querySelector('#sort-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals= document.querySelector('#deals');
const sectionSales = document.querySelector('#sales');
const spanNbDeals = document.querySelector('#nbDeals');
const spanNbSales = document.querySelector('#nbSales');
const spanAvgPrice = document.querySelector('#avgPrice');
const spanP5Price = document.querySelector('#p5Price');
const spanP25Price = document.querySelector('#p25Price');
const spanP50Price = document.querySelector('#p50Price');

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

/**
 * Fetch Vinted sales for a given lego set id
 * @param  {String} id - lego set id
 * @return {Object}
 */
const fetchSales = async (id) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/sales?id=${id}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return [];
    }

    return body.data.result || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

/**
 * Render list of sales
 * @param  {Array} sales
 */
const renderSales = sales => {
  if (!sales || sales.length === 0) {
    sectionSales.innerHTML = '<h2>Vinted Sales</h2><p>No sales found for this lego set.</p>';
    if (spanNbSales) spanNbSales.innerHTML = 0;
    return;
  }

  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = sales
    .map(sale => {
      return `
      <div class="sale">
        <a href="${sale.link}" target="_blank" rel="noopener noreferrer">${sale.title}</a>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionSales.innerHTML = '<h2>Vinted Sales</h2>';
  sectionSales.appendChild(fragment);
  if (spanNbSales) spanNbSales.innerHTML = sales.length;
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}">${deal.title}</a>
        <span>${deal.price}</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const deals = await fetchDeals(parseInt(event.target.value), currentPagination.pageSize);
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

/**
 * Filter and sort deals based on filter type
 * @param  {Array} deals - deals to filter
 * @param  {String} filter - filter type
 * @return {Array} filtered and sorted deals
 */
const filterDeals = (deals, filter) => {
  let filtered = [...deals];
  
  switch (filter) {
    case 'all':
      // Return all deals in original order
      break;
    case 'best-discount':
      // Filter: discount > 50%
      filtered = filtered
        .filter(deal => parseFloat(deal.discount) > 50)
      break;
    case 'most-commented':
      // Filter: comments >= 1
      filtered = filtered
        .filter(deal => parseInt(deal.comments) >= 15)
        .sort((a, b) => parseInt(b.comments) - parseInt(a.comments));
      break;
    case 'hot-deals':
      // Filter: temperature > 100
      filtered = filtered
        .filter(deal => parseInt(deal.temperature) > 100)
      break;
    default:
      break;
  }
  
  return filtered;
};

selectFilters.addEventListener('change', (event) => {
  const filter = event.target.value;
  const filteredDeals = filterDeals(currentDeals, filter);
  
  renderDeals(filteredDeals);
});

selectSort.addEventListener('change', (event) => {
  const sort = event.target.value;
  let sortedDeals = [...currentDeals];

  switch (sort) {
    case 'price-asc':
      // Sort by price ascending (cheapest first)
      sortedDeals.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      break;
    case 'price-desc':
      // Sort by price descending (most expensive first)
      sortedDeals.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      break;
    case 'date-asc':
      // Sort by date ascending (most recent first)
      sortedDeals.sort((a, b) => new Date(b.published) - new Date(a.published));
      break;
    case 'date-desc':
      // Sort by date descending (oldest first)
      sortedDeals.sort((a, b) => new Date(a.published) - new Date(b.published));
      break;
    default:
      break;
  }

  renderDeals(sortedDeals);
});

/**
 * Display Vinted sales for a given lego set id
 */
selectLegoSetIds.addEventListener('change', async (event) => {
  const legoSetId = event.target.value;
  
  if (legoSetId) {
    const sales = await fetchSales(legoSetId);
    renderSales(sales);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});
