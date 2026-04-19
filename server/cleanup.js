require('dotenv').config();
const mongoose = require('mongoose');
const StockDay = require('./src/models/StockDay');

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swingtrading');
  await StockDay.deleteMany({ date: { $in: ['2026-04-19', '2026-04-18', '2026-04-13'] } });
  console.log('Deleted weekend test data');
  process.exit(0);
}
clean();
