const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol:       { type: String, required: true },
  predicted:    { type: Boolean, default: false },
  p_return:     { type: Number, default: 0 },
  close:        { type: Number, default: 0 },
  ema:          { type: Number, default: 0 },
  rsi:          { type: Number, default: 0 },
  volume:       { type: Number, default: 0 },
  // Yahoo Finance enriched fields
  currentPrice:    { type: Number, default: null },
  change:          { type: Number, default: null }, // % change
  marketCap:       { type: Number, default: null },
  peRatio:         { type: Number, default: null },
  weekHigh52:      { type: Number, default: null },
  weekLow52:       { type: Number, default: null },
  sector:          { type: String, default: null },
  industry:        { type: String, default: null },
});

const stockDaySchema = new mongoose.Schema({
  date:    { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
  stocks:  [stockSchema],
  fetchedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StockDay', stockDaySchema);
