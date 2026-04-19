const yahooFinance = require('yahoo-finance2').default;

/**
 * Enriches stock array with live data from Yahoo Finance (NSE format: SYMBOL.NS)
 * Handles failures gracefully — returns nulls if a symbol is not found.
 */
async function enrichStocks(stocks) {
  const enriched = await Promise.all(
    stocks.map(async (stock) => {
      try {
        const ticker = `${stock.symbol}.NS`;
        const quote = await yahooFinance.quote(ticker, {}, { validateResult: false });

        return {
          ...stock,
          currentPrice: quote.regularMarketPrice         ?? null,
          change:       quote.regularMarketChangePercent ?? null,
          marketCap:    quote.marketCap                  ?? null,
          peRatio:      quote.trailingPE                 ?? null,
          weekHigh52:   quote.fiftyTwoWeekHigh           ?? null,
          weekLow52:    quote.fiftyTwoWeekLow            ?? null,
          sector:       quote.sector                     ?? null,
          industry:     quote.industry                   ?? null,
        };
      } catch (err) {
        console.warn(`[Enricher] Could not fetch data for ${stock.symbol}:`, err.message);
        return {
          ...stock,
          currentPrice: null,
          change:       null,
          marketCap:    null,
          peRatio:      null,
          weekHigh52:   null,
          weekLow52:    null,
          sector:       null,
          industry:     null,
        };
      }
    })
  );
  return enriched;
}

module.exports = { enrichStocks };
