const { parse } = require('csv-parse/sync');

/**
 * Parses a CSV buffer from the email attachment.
 * Expected columns: name, p_return_%, close, ema, rsi, volume, Predicted, ChartLink, Fundamental
 */
function parseCSV(buffer) {
  const content = buffer.toString('utf8');

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row) => ({
    symbol:    (row.name || '').toUpperCase().trim(),
    p_return:  parseFloat(row['p_return_%']) || 0,
    close:     parseFloat(row.close)         || 0,
    ema:       parseFloat(row.ema)           || 0,
    rsi:       parseFloat(row.rsi)           || 0,
    volume:    parseInt(row.volume)          || 0,
    predicted: String(row.Predicted).toUpperCase() === 'TRUE',
  })).filter(s => s.symbol); // drop empty rows
}

module.exports = { parseCSV };
