export default function Header({ dates, selectedDate, onDateChange, onFetchNow, fetching, lastFetched }) {
  const fmt = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <header style={{
      padding: '28px 0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      borderBottom: '1px solid var(--border)',
      marginBottom: '24px'
    }}>
      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: 42, height: 42,
          background: 'linear-gradient(135deg, var(--accent) 0%, #c9850e 100%)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0,
          boxShadow: '0 4px 16px var(--accent-glow)'
        }}>📈</div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
            SwingRadar
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>
            NSE Daily Stock Recommendations
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {lastFetched && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Updated: {fmt(lastFetched)}
          </span>
        )}

        {dates.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📅</span>
            <select
              value={selectedDate}
              onChange={e => onDateChange(e.target.value)}
            >
              {dates.map(d => (
                <option key={d.date} value={d.date}>{d.date}</option>
              ))}
            </select>
          </div>
        )}

        <button
          className="btn btn-accent"
          onClick={onFetchNow}
          disabled={fetching}
          style={{ minWidth: 120 }}
        >
          {fetching ? '⏳ Fetching...' : '⚡ Fetch Now'}
        </button>
      </div>
    </header>
  )
}
