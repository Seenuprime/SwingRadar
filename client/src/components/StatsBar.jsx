function fmt(n, dec = 2) {
  if (n === null || n === undefined) return '—'
  return Number(n).toFixed(dec)
}

function fmtCap(n) {
  if (!n) return '—'
  if (n >= 1e12) return `₹${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `₹${(n / 1e9).toFixed(2)}B`
  if (n >= 1e7)  return `₹${(n / 1e7).toFixed(2)}Cr`
  return `₹${n}`
}

export default function StatsBar({ stocks = [], date, fetchedAt }) {
  const total     = stocks.length
  const buyCount  = stocks.filter(s => s.predicted).length
  const watchCount = total - buyCount
  const avgRSI    = total ? (stocks.reduce((a, s) => a + (s.rsi || 0), 0) / total).toFixed(1) : '—'
  const avgReturn = total ? (stocks.reduce((a, s) => a + (s.p_return || 0), 0) / total).toFixed(2) : '—'

  const cards = [
    { label: 'Total Stocks',   value: total,              color: 'var(--text-primary)' },
    { label: '🟢 Predicted Buy', value: buyCount,          color: 'var(--green)' },
    { label: '👁 Watch',        value: watchCount,          color: 'var(--text-secondary)' },
    { label: 'Avg Return %',   value: `${avgReturn}%`,     color: 'var(--accent)' },
    { label: 'Avg RSI',        value: avgRSI,              color: 'var(--blue)' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
      marginBottom: '20px',
    }}>
      {cards.map(c => (
        <div key={c.label} className="card fade-in" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 4 }}>
            {c.label}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: c.color }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  )
}
