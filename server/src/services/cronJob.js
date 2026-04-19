const cron = require('node-cron');
const { fetchAllCSVsFromLastTwoWeeks } = require('./emailService');
const { parseCSV }    = require('./csvParser');
const { enrichStocks } = require('./stockEnricher');
const StockDay         = require('../models/StockDay');

async function runFetchPipeline() {
  console.log('[Cron] Starting email fetch pipeline (last 2 weeks)...');
  try {
    const emails = await fetchAllCSVsFromLastTwoWeeks();

    if (emails.length === 0) {
      return { success: true, upToDate: true, message: 'No emails found in the last 2 weeks.' };
    }

    let saved = 0;
    const savedDates = [];

    for (const { csvBuffer, receivedDate } of emails) {
      const stocks   = parseCSV(csvBuffer);
      const enriched = await enrichStocks(stocks);
      
      // Convert receivedDate to IST before extracting YYYY-MM-DD
      const estTime = new Date(receivedDate.getTime() + 5.5 * 60 * 60 * 1000);
      const dateKey = estTime.toISOString().slice(0, 10);

      await StockDay.findOneAndUpdate(
        { date: dateKey },
        { date: dateKey, stocks: enriched, fetchedAt: new Date() },
        { upsert: true, new: true }
      );

      console.log(`[Cron] Saved ${enriched.length} stocks for ${dateKey}`);
      savedDates.push(dateKey);
      saved += enriched.length;
    }

    return { success: true, emailsProcessed: emails.length, savedDates, totalStocks: saved };
  } catch (err) {
    console.error('[Cron] Pipeline error:', err.message);
    return { success: false, error: err.message };
  }
}

function startCronJob() {
  const schedule = process.env.CRON_SCHEDULE || '30 14 * * 1-6';
  console.log(`[Cron] Scheduling email fetch: "${schedule}"`);
  cron.schedule(schedule, runFetchPipeline, { timezone: 'Asia/Kolkata' });
}

module.exports = { startCronJob, runFetchPipeline };
