import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { scrape } from './websites/dealsLab.js';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const PORT = 8092;

const app = express();

// We load json files as data source
let DEALS = [];
let SALES = {};

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(cors())

app.get('/', (request, response) => {
  response.send({'ack': true});
});


app.get('/deals/search', (request, response) => {
  try {
    const { limit = 12, price, date, filterBy } = request.query;

    let results = [...DEALS];

    // Filtre par prix max
    if (price) {
      results = results.filter(d => d.price <= parseFloat(price));
    }

    // Filtre par date (timestamp unix)
    if (date) {
      const from = new Date(date).getTime() / 1000;
      results = results.filter(d => d.published >= from);
    }

    // Filtres spéciaux
    if (filterBy === 'best-discount') {
      results = results.filter(d => d.discount > 0)
                       .sort((a, b) => b.discount - a.discount);
    } else if (filterBy === 'most-commented') {
      results = results.sort((a, b) => b.comments - a.comments);
    } else {
      // Par défaut : tri par prix croissant
      results = results.sort((a, b) => a.price - b.price);
    }

    const total = results.length;
    results = results.slice(0, parseInt(limit));

    return response.status(200).json({ limit: parseInt(limit), total, results });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ success: false, data: [] });
  }
});

app.get('/deals/:id', (request, response) => {
  const { id } = request.params;

  const deal = DEALS.find(d => d._id === id || d.uuid === id);

  if (!deal) {
    return response.status(404).json({ success: false, data: null });
  }

  return response.status(200).json({ success: true, data: deal });
});

app.get('/sales/search', (request, response) => {
  try {
    const { legoSetId, limit = 12 } = request.query;

    let results = legoSetId ? (SALES[legoSetId] || []) : [];

    // Tri par date décroissante
    results = results.sort((a, b) => b.published - a.published);

    const total = results.length;
    results = results.slice(0, parseInt(limit));

    return response.status(200).json({ limit: parseInt(limit), total, results });
  } catch (error) {
    console.error(error);
    return response.status(404).json({ success: false, data: { result: [] } });
  }
});

app.listen(PORT, () => {
  // when we start the server we load available json files

  try {
    DEALS = JSON.parse(
      readFileSync(path.join(__dirname, 'sources', 'dealabs.json'), 'utf8')
    );
  } catch (error) {
    console.warn(`⚠️  ${error}`);
  }

  try {
    SALES = JSON.parse(
      readFileSync(path.join(__dirname, 'sources', 'vinted.json'), 'utf8')
    );
  } catch (error) {
    console.warn(`⚠️  ${error}`);
  }
})

console.log(`📡 Running on port ${PORT}`);
