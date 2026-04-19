/**
 * Multi-day seed script — creates test data across last 5 days for testing date pills
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const StockDay = require('./src/models/StockDay');

const baseStocks = [
  { symbol: 'RELIANCE',   predicted: true,  p_return: 4.2,  close: 2890.5, ema: 2750.0, rsi: 58.3,  volume: 45230000 },
  { symbol: 'TCS',        predicted: true,  p_return: 2.8,  close: 3520.0, ema: 3400.0, rsi: 52.1,  volume: 12300000 },
  { symbol: 'HDFCBANK',   predicted: true,  p_return: 3.5,  close: 1670.0, ema: 1590.0, rsi: 44.7,  volume: 87650000 },
  { symbol: 'ANUHPHR',    predicted: false, p_return: 5.3,  close: 82.7,   ema: 76.8,   rsi: 51.2,  volume: 746540  },
  { symbol: 'ASIANTILES', predicted: true,  p_return: 1.5,  close: 73.0,   ema: 65.0,   rsi: 47.3,  volume: 73590120 },
  { symbol: 'INFY',       predicted: false, p_return: 1.9,  close: 1478.0, ema: 1420.0, rsi: 38.5,  volume: 34500000 },
  { symbol: 'WIPRO',      predicted: false, p_return: -0.5, close: 480.0,  ema: 495.0,  rsi: 63.0,  volume: 56700000 },
  { symbol: 'ICICIBANK',  predicted: true,  p_return: 3.1,  close: 1185.0, ema: 1120.0, rsi: 55.8,  volume: 98700000 },
  { symbol: 'TATASTEEL',  predicted: false, p_return: 2.2,  close: 148.0,  ema: 140.0,  rsi: 49.0,  volume: 120000000 },
  { symbol: 'BAJFINANCE', predicted: true,  p_return: 4.8,  close: 7200.0, ema: 6900.0, rsi: 61.5,  volume: 6780000  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swingtrading');
  console.log('[Seed] Connected to MongoDB');

  // Seed last 5 days (Mon-Sat style)
  for (let daysAgo = 0; daysAgo < 5; daysAgo++) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateKey = d.toISOString().slice(0, 10);

    // Slightly vary returns for each day
    const stocks = baseStocks.map(s => ({
      ...s,
      p_return: parseFloat((s.p_return + (Math.random() - 0.5)).toFixed(2)),
      rsi: parseFloat((s.rsi + (Math.random() * 4 - 2)).toFixed(1)),
    }));

    await StockDay.findOneAndUpdate(
      { date: dateKey },
      { date: dateKey, stocks, fetchedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log(`[Seed] Saved ${stocks.length} stocks for ${dateKey}`);
  }

  await mongoose.disconnect();
  console.log('[Seed] Done!');
}

seed().catch(e => { console.error(e); process.exit(1); });
