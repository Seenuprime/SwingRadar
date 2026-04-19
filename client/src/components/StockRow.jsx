import { useState, useRef } from 'react'

const API = '/api'

function fmt(n, d = 2) {
  if (n == null) return '—'
  return Number(n).toFixed(d)
}

function fmtVol(n) {
  if (!n) return '—'
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(n)
}

function rsiTag(r) {
  if (!r) return { label: '—', color: 'var(--text-3)' }
  if (r < 35) return { label: fmt(r, 1), color: 'var(--positive)' }
  if (r > 65) return { label: fmt(r, 1), color: 'var(--negative)' }
  return { label: fmt(r, 1), color: 'var(--text-2)' }
}

function relTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d >= 1) return `${d}d ago`
  if (h >= 1) return `${h}h ago`
  return 'just now'
}

export default function StockRow({ stock, isNewsOpen, onToggleNews }) {
  const chartRef = useRef(null)
  const fundRef  = useRef(null)
  const [tabsOpen, setTabsOpen] = useState(false)
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsItems, setNewsItems]     = useState(null)

  const chartUrl = `https://www.tradingview.com/chart/?symbol=NSE:${stock.symbol}`
  const fundUrl  = `https://ticker.finology.in/company/${stock.symbol}`

  const handleOpen = () => {
    try { if (chartRef.current) chartRef.current.close() } catch {}
    try { if (fundRef.current)  fundRef.current.close()  } catch {}
    chartRef.current = window.open(chartUrl, `sr_chart_${stock.symbol}`)
    fundRef.current  = window.open(fundUrl,  `sr_fund_${stock.symbol}`)
    setTabsOpen(true)
  }

  const handleClose = () => {
    try { if (chartRef.current) chartRef.current.close() } catch {}
    try { if (fundRef.current)  fundRef.current.close()  } catch {}
    // Fallback: navigate named window then close
    try {
      setTimeout(() => {
        const c = window.open('about:blank', `sr_chart_${stock.symbol}`)
        if (c) c.close()
        const f = window.open('about:blank', `sr_fund_${stock.symbol}`)
        if (f) f.close()
      }, 60)
    } catch {}
    chartRef.current = null
    fundRef.current  = null
    setTabsOpen(false)
  }

  const handleNews = async () => {
    onToggleNews()
    if (newsItems !== null) return
    setNewsLoading(true)
    try {
      const r = await fetch(`${API}/news/${stock.symbol}`)
      const d = await r.json()
      setNewsItems(d.news || [])
    } catch {
      setNewsItems([])
    }
    setNewsLoading(false)
  }

  const ret    = stock.p_return || 0
  const rsi    = rsiTag(stock.rsi)
  const inits  = stock.symbol.slice(0, 2)

  return (
    <>
      <tr className="stock-row">

        {/* Symbol */}
        <td data-label="Symbol">
          <div className="sym-cell">
            <div className="sym-badge">{inits}</div>
            <span className="sym-name">{stock.symbol}</span>
          </div>
        </td>

        {/* Return */}
        <td data-label="Return">
          <span className={`ret-chip ${ret >= 0 ? 'pos' : 'neg'}`}>
            {ret >= 0 ? '+' : ''}{fmt(ret)}%
          </span>
        </td>

        {/* Close */}
        <td data-label="Close">
          <span className="mono" style={{ color: 'var(--text-2)' }}>₹{fmt(stock.close)}</span>
        </td>

        {/* EMA */}
        <td data-label="EMA">
          <span className="mono" style={{ color: 'var(--text-3)' }}>₹{fmt(stock.ema)}</span>
        </td>

        {/* RSI */}
        <td data-label="RSI">
          <span className="mono" style={{ color: rsi.color, fontWeight: 600 }}>{rsi.label}</span>
        </td>

        {/* Volume */}
        <td data-label="Volume">
          <span className="mono" style={{ color: 'var(--text-3)', fontSize: 12 }}>{fmtVol(stock.volume)}</span>
        </td>

        {/* Actions */}
        <td data-label="Actions">
          <div className="actions-cell">
            <button className="btn btn-open" onClick={handleOpen} title="Open chart + fundamentals">
              Chart
            </button>
            <button
              className="btn btn-close-tab"
              onClick={handleClose}
              disabled={!tabsOpen}
              title="Close tabs"
            >
              ✕
            </button>
            <button
              className={`btn btn-news ${isNewsOpen ? 'active' : ''}`}
              onClick={handleNews}
              title="Toggle news"
            >
              News
            </button>
          </div>
        </td>
      </tr>

      {/* News panel */}
      {isNewsOpen && (
        <tr className="news-row">
          <td colSpan={7} style={{ padding: 0 }}>
            <div className="news-panel">
              <div className="news-panel-title">Latest news — {stock.symbol}</div>

              {newsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div className="skel" style={{ height: 12, width: '75%' }} />
                      <div className="skel" style={{ height: 10, width: '35%' }} />
                    </div>
                  ))}
                </div>
              ) : newsItems && newsItems.length > 0 ? (
                newsItems.map((n, i) => (
                  <a key={i} href={n.link} target="_blank" rel="noreferrer" className="news-item">
                    <div className="news-text">
                      <div className="news-headline">{n.title}</div>
                      <div className="news-byline">
                        {n.publisher && <span>{n.publisher}</span>}
                        {n.pubDate && <span>·</span>}
                        {n.pubDate && <span>{relTime(n.pubDate)}</span>}
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <div className="news-empty">No news found for {stock.symbol}</div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
