import { useState } from 'react'
import StockRow from './StockRow'

const COLS = [
  { label: 'Symbol',   width: '160px' },
  { label: 'Return',   width: '90px'  },
  { label: 'Close',    width: '90px'  },
  { label: 'EMA',      width: '90px'  },
  { label: 'RSI',      width: '70px'  },
  { label: 'Volume',   width: '100px' },
  { label: 'Actions',  width: '180px' },
]

function SkeletonRow() {
  return (
    <tr className="stock-row">
      {COLS.map(c => (
        <td key={c.label} data-label={c.label} style={{ padding: '11px 18px' }}>
          <div className="skel" style={{ height: 13, width: '70%', borderRadius: 3 }} />
        </td>
      ))}
    </tr>
  )
}

export default function StockTable({ stocks, loading }) {
  const [openNewsSymbol, setOpenNewsSymbol] = useState(null)
  const [activeSymbol, setActiveSymbol] = useState(null)

  const sorted = [...stocks].sort((a, b) => (b.p_return || 0) - (a.p_return || 0))

  const toggleNews = (symbol) =>
    setOpenNewsSymbol(prev => prev === symbol ? null : symbol)

  return (
    <div className="t-wrap fade-in">
      <div className="t-scroll">
        <table>
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.label} style={{ minWidth: c.width }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : sorted.length === 0
                ? (
                  <tr>
                    <td colSpan={COLS.length}>
                      <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <div className="empty-title">No stocks for this date</div>
                        <div className="empty-sub">Click Sync to pull the latest data from Gmail</div>
                      </div>
                    </td>
                  </tr>
                )
                : sorted.map((stock, i) => (
                    <StockRow
                      key={stock.symbol + i}
                      stock={stock}
                      isActive={activeSymbol === stock.symbol}
                      isNewsOpen={openNewsSymbol === stock.symbol}
                      onToggleNews={() => toggleNews(stock.symbol)}
                      onInteract={() => setActiveSymbol(stock.symbol)}
                    />
                  ))
            }
          </tbody>
        </table>
      </div>
      {!loading && sorted.length > 0 && (
        <div className="t-footer">{sorted.length} stocks · sorted by return %</div>
      )}
    </div>
  )
}
