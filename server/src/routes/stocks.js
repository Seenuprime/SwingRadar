const express  = require('express');
const router   = express.Router();
const StockDay = require('../models/StockDay');
const { runFetchPipeline } = require('../services/cronJob');
const yahooFinance = require('yahoo-finance2').default;

// GET /api/dates
router.get('/dates', async (req, res) => {
  try {
    const days = await StockDay.find({}, 'date fetchedAt').sort({ date: -1 }).limit(14);
    res.json(days.map(d => ({ date: d.date, fetchedAt: d.fetchedAt })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stocks?date=YYYY-MM-DD
router.get('/stocks', async (req, res) => {
  try {
    let { date } = req.query;
    const day = date
      ? await StockDay.findOne({ date })
      : await StockDay.findOne().sort({ date: -1 });
    if (!day) return res.json({ date: date || null, stocks: [] });
    res.json({ date: day.date, fetchedAt: day.fetchedAt, stocks: day.stocks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fetch-now
router.post('/fetch-now', async (req, res) => {
  try {
    const result = await runFetchPipeline();
    result.success ? res.json(result) : res.status(500).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const Parser = require('rss-parser');
const parser = new Parser();

// Livemint RSS feeds (markets + companies — trusted Indian financial source)
const LIVEMINT_FEEDS = [
  'https://www.livemint.com/rss/markets',
  'https://www.livemint.com/rss/companies',
];

// GET /api/news/:symbol  — fetch latest Livemint news filtered by stock symbol
router.get('/news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    // Also try the company name if we can derive it, but symbol alone works well
    const keyword = symbol.toLowerCase();

    // Fetch both feeds in parallel
    const feedResults = await Promise.allSettled(
      LIVEMINT_FEEDS.map(url => parser.parseURL(url))
    );

    // Collect all items from whichever feeds succeeded
    const allItems = [];
    for (const result of feedResults) {
      if (result.status === 'fulfilled') {
        allItems.push(...(result.value.items || []));
      }
    }

    // Filter articles that mention the symbol in title or content snippet
    const relevant = allItems.filter(item => {
      const text = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
      return text.includes(keyword);
    });

    // Sort newest first
    relevant.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

    // If no symbol-specific results, fall back to latest markets news
    const pool = relevant.length > 0 ? relevant : allItems.sort(
      (a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0)
    );

    const news = pool.slice(0, 8).map(item => ({
      title:     item.title || '',
      publisher: 'Livemint',
      link:      item.link || '',
      pubDate:   item.pubDate ? new Date(item.pubDate).toISOString() : null,
    }));

    res.json({ symbol, news });
  } catch (err) {
    console.warn(`[News] Livemint fetch failed for ${req.params.symbol}:`, err.message);
    res.json({ symbol: req.params.symbol, news: [] });
  }
});

module.exports = router;
