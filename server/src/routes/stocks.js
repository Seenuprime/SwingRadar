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
const parser = new Parser({
  customFields: {
    item: ['source']
  }
});

// GET /api/news/:symbol  — fetch latest news for a stock from trusted Indian sources
router.get('/news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Search specifically for the symbol on Livemint, Moneycontrol, or Economic Times
    const query = encodeURIComponent(`"${symbol}" stock (site:livemint.com OR site:moneycontrol.com OR site:economictimes.indiatimes.com)`);
    const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

    const feed = await parser.parseURL(feedUrl);

    // Sort items newest first
    const sortedItems = (feed.items || []).sort((a, b) => {
      return new Date(b.pubDate || 0) - new Date(a.pubDate || 0);
    });

    const news = sortedItems.slice(0, 8).map(item => ({
      title:     item.title || '',
      // Extract publisher from the Google News source tag, or fallback
      publisher: item.source || feed.title || 'Finance News',
      link:      item.link || '',
      pubDate:   item.pubDate ? new Date(item.pubDate).toISOString() : null,
    }));

    // If no news, we strictly return an empty array so the frontend says "No news found"
    res.json({ symbol, news });
  } catch (err) {
    console.warn(`[News] Trusted fetch failed for ${req.params.symbol}:`, err.message);
    res.json({ symbol: req.params.symbol, news: [] });
  }
});

module.exports = router;
