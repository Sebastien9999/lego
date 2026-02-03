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
let currentFilter = 'all';
let currentSort = 'price-asc';
let currentSearch = '';

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectFilters = document.querySelector('#filters-select');
const selectSort = document.querySelector('#sort-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const searchInput = document.querySelector('#search-input');
const sectionDeals = document.querySelector('#deals');
const sectionBestDeal = document.querySelector('#best-deal');
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
const renderBestDeal = deal => {
  if (!deal) {
    sectionBestDeal.innerHTML = `
      <h2>Best Deal</h2>
      <div class="deal-card">
        <strong>No deal selected yet</strong>
        <span>Use search, sorting, or filters to find the best available set.</span>
      </div>
    `;
    return;
  }

  sectionBestDeal.innerHTML = `
    <h2>Best Deal</h2>
    <div class="deal-card">
      <strong>${deal.title}</strong>
      <a href="${deal.link}" target="_blank" rel="noopener noreferrer">View deal</a>
      <span class="price">${deal.price}</span>
      <div class="meta">
        <span>Set id: ${deal.id}</span>
        <span>Discount: ${deal.discount}%</span>
        <span>Comments: ${deal.comments || 'N/A'}</span>
        <span>Published: ${deal.published || 'unknown'}</span>
      </div>
    </div>
  `;
};

const renderDeals = (deals, bestDeal) => {
  const template = deals
    .filter(deal => !bestDeal || deal.uuid !== bestDeal.uuid)
    .map(deal => {
      return `
      <div class="deal-row" id="${deal.uuid}">
        <span>${deal.id}</span>
        <div>
          <a href="${deal.link}" target="_blank" rel="noopener noreferrer">${deal.title}</a>
          <div class="meta">
            <span>Discount ${deal.discount}%</span>
            <span>Price ${deal.price}</span>
          </div>
        </div>
        <span class="price">${deal.price}</span>
      </div>
    `;
    })
    .join('');

  sectionDeals.innerHTML = '<h2>Deals</h2><div id="deals-list">' + (template || '<p>No matching deals found.</p>') + '</div>';
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

const getBestDeal = deals => {
  if (!deals || deals.length === 0) return null;

  return deals.reduce((currentBest, deal) => {
    const discount = parseFloat(deal.discount) || 0;
    const currentDiscount = parseFloat(currentBest.discount) || 0;

    if (discount > currentDiscount) {
      return deal;
    }

    if (discount === currentDiscount) {
      return parseFloat(deal.price) < parseFloat(currentBest.price) ? deal : currentBest;
    }

    return currentBest;
  }, deals[0]);
};

const sortDeals = (deals, sort) => {
  const sorted = [...deals];

  switch (sort) {
    case 'price-asc':
      sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      break;
    case 'price-desc':
      sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(b.published) - new Date(a.published));
      break;
    case 'date-desc':
      sorted.sort((a, b) => new Date(a.published) - new Date(b.published));
      break;
    default:
      break;
  }

  return sorted;
};

const searchDeals = (deals, searchTerm) => {
  if (!searchTerm) return deals;

  const lowerSearch = searchTerm.toLowerCase();
  return deals.filter(deal => {
    const title = String(deal.title || '').toLowerCase();
    const id = String(deal.id || '').toLowerCase();
    const discount = String(deal.discount || '').toLowerCase();

    return title.includes(lowerSearch) || id.includes(lowerSearch) || discount.includes(lowerSearch);
  });
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = () => {
  const filteredDeals = filterDeals(currentDeals, currentFilter);
  const sortedDeals = sortDeals(filteredDeals, currentSort);
  const searchedDeals = searchDeals(sortedDeals, currentSearch);
  const bestDeal = getBestDeal(searchedDeals);

  renderBestDeal(bestDeal);
  renderDeals(searchedDeals, bestDeal);
  renderPagination(currentPagination);
  renderIndicators(currentPagination);
  renderLegoSetIds(currentDeals);
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
  currentFilter = event.target.value;
  render();
});

selectSort.addEventListener('change', (event) => {
  currentSort = event.target.value;
  render();
});

searchInput.addEventListener('input', (event) => {
  currentSearch = event.target.value.trim();
  render();
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
  render();
});
