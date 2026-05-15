const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Load tools from JSON file
function loadTools() {
  const data = fs.readFileSync(path.join(__dirname, 'tools.json'), 'utf8');
  return JSON.parse(data);
}

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'Bitcoin Tools Directory',
    provider: 'EM',
    version: '1.0.0',
    endpoints: {
      all_tools: 'GET /tools',
      search: 'GET /tools?q=wallet&category=wallet&region=africa&lightning=true',
      categories: 'GET /categories'
    }
  });
});

// List categories
app.get('/categories', (req, res) => {
  const tools = loadTools();
  const categories = [...new Set(tools.map(t => t.category))];
  res.json({
    total: categories.length,
    categories: categories.sort()
  });
});

// Main endpoint — search and filter tools
app.get('/tools', (req, res) => {
  let tools = loadTools();
  const { q, category, region, lightning, platform, limit } = req.query;

  // Full-text search across name and description
  if (q) {
    const search = q.toLowerCase();
    tools = tools.filter(t =>
      t.name.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search) ||
      t.category.toLowerCase().includes(search)
    );
  }

  // Filter by category
  if (category) {
    tools = tools.filter(t => t.category === category.toLowerCase());
  }

  // Filter by region
  if (region) {
    const r = region.toLowerCase();
    tools = tools.filter(t => t.region.includes(r) || t.region.includes('global'));
  }

  // Filter by Lightning support
  if (lightning === 'true') {
    tools = tools.filter(t => t.lightning === true);
  }

  // Filter by platform
  if (platform) {
    const p = platform.toLowerCase();
    tools = tools.filter(t => t.platforms.includes(p));
  }

  // Limit results
  const max = Math.min(parseInt(limit) || 50, 50);
  tools = tools.slice(0, max);

  res.json({
    total: tools.length,
    query: { q, category, region, lightning, platform },
    results: tools
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Bitcoin Tools API running on port ${PORT}`);
});