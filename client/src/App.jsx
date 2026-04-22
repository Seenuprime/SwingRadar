import { useState, useEffect, useRef } from 'react'
import StockTable from './components/StockTable'
import LoginModal from './components/LoginModal'
import { useAuth } from './context/AuthContext'

const API = '/api'

function fmtDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

/* ── Social links ── */
const SOCIAL = [
  {
    label: 'Twitter / X',
    href: 'https://x.com/seenus101',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/srinivas-h-m-8a4b1422a/',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/Seenuprime',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
]

/* ── Footer ── */
function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-about">
          <div className="footer-name">Srinivas H M</div>
          <p className="footer-bio">
            CS graduate with a background in Python, Machine Learning &amp; Deep Learning.
            I build AI-powered tools for algorithmic trading on NSE — SwingRadar is one of them.
          </p>
          <div className="footer-links">
            {SOCIAL.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="footer-link"
                title={s.label}
              >
                {s.icon}
                <span>{s.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="footer-contact">
          <div className="footer-contact-title">Get in touch</div>
          <p className="footer-contact-text">
            Questions about the model, the strategy, or want to collaborate?
            Reach out — always happy to talk markets and ML.
          </p>
          <a
            href="https://x.com/seenus101"
            target="_blank"
            rel="noreferrer"
            className="footer-contact-btn"
          >
            Message on X →
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Srinivas H M · SwingRadar</span>
        <span>NSE data via Gmail · News via Livemint</span>
      </div>
    </footer>
  )
}

/* ── Main App ── */
export default function App() {
  const [dates, setDates]               = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [stockData, setStockData]       = useState(null)
  const [loading, setLoading]           = useState(false)
  const [fetching, setFetching]         = useState(false)
  const [toast, setToast]               = useState(null)
  const [theme, setTheme]               = useState(() => localStorage.getItem('sr_theme') || 'dark')

  useEffect(() => {
    localStorage.setItem('sr_theme', theme)
    document.body.className = theme === 'light' ? 'light' : ''
  }, [theme])

  useEffect(() => {
    // 1. Initial cached fetch
    fetch(`${API}/dates`)
      .then(r => r.json())
      .then(data => {
        setDates(data)
        if (data.length > 0) setSelectedDate(data[0].date)
      })
      .catch(() => showToast('error', 'Cannot reach server.'))

    // 2. Silent Background Sync to ensure data is fresh (Render sleep workaround)
    const silentBgSync = async () => {
      try {
        const res = await fetch(`${API}/fetch-now`, { method: 'POST' });
        const data = await res.json();
        // If data was missing or behind and just got updated
        if (data.success && !data.upToDate) {
          const dr = await fetch(`${API}/dates`);
          const dd = await dr.json();
          setDates(dd);
          if (dd.length > 0) setSelectedDate(dd[0].date);
        }
      } catch (err) {
        // fail silently in background
      }
    };
    
    // Slight delay so it doesn't block the initial React render
    setTimeout(silentBgSync, 1500);
  }, [])

  const { user, loginGoogle, loginGithub, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  // Close profile menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    setLoading(true)
    fetch(`${API}/stocks?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => { setStockData(data); setLoading(false) })
      .catch(() => { showToast('error', 'Failed to load stocks.'); setLoading(false) })
  }, [selectedDate])

  function showToast(type, msg, duration = 4000) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), duration)
  }

  const stocks = stockData?.stocks || []
  const fetchedTime = stockData?.fetchedAt
    ? new Date(stockData.fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="app">

      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">📈</div>
          <div>
            <div className="brand-name">SwingRadar</div>
            <div className="brand-tagline">NSE daily picks · AI-powered</div>
          </div>
        </div>
        <div className="topbar-actions">
          {fetchedTime && (
            <span className="last-updated">Updated {fetchedTime}</span>
          )}
          <button
            className="btn btn-icon"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          
          {user ? (
            <div className="user-profile-wrap" ref={profileRef}>
              <div className="user-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <img src={user.avatarUrl || 'https://github.com/identicons/default.png'} alt={user.name || 'User'} className="user-avatar" />
              </div>
              {showProfileMenu && (
                <div className="profile-dropdown fade-in">
                  <div className="profile-info">
                    <div className="profile-name">{user.name || 'SwingRadar User'}</div>
                    <div className="profile-email">{user.email || 'No email provided'}</div>
                  </div>
                  <div className="profile-divider"></div>
                  <button className="btn-logout" onClick={() => { setShowProfileMenu(false); logout(); }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      {user ? (
        <>
          {/* ── Date Nav ── */}
          {dates.length > 0 && (
            <nav className="date-nav">
              {dates.map(d => (
                <button
                  key={d.date}
                  className={`date-tab ${selectedDate === d.date ? 'active' : ''}`}
                  onClick={() => setSelectedDate(d.date)}
                >
                  {fmtDate(d.date)}
                </button>
              ))}
            </nav>
          )}

          {/* ── Ticker ── */}
          {stocks.length > 0 && (
            <div className="ticker-bar">
              <div
                className="ticker-track"
                style={{ animationDuration: `${Math.max(28, stocks.length * 4)}s` }}
              >
                {[...stocks, ...stocks].map((s, i) => (
                  <div className="ticker-item" key={i}>
                    <span className="t-sym">{s.symbol}</span>
                    <span className="t-price">₹{Number(s.close).toFixed(0)}</span>
                    <span
                      className="t-chg"
                      style={{ color: s.p_return >= 0 ? 'var(--positive)' : 'var(--negative)' }}
                    >
                      {s.p_return >= 0 ? '+' : ''}{Number(s.p_return).toFixed(1)}%
                    </span>
                    <span className="sep">·</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Toast ── */}
          {toast && (
            <div className={`toast ${toast.type}`} role="alert">
              {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
            </div>
          )}

          {/* ── Table section ── */}
          <div className="section-row">
            <span className="section-label">{selectedDate || '—'}</span>
            {stocks.length > 0 && (
              <span className="section-meta">{stocks.length} stocks</span>
            )}
          </div>

          <StockTable stocks={stocks} loading={loading} />
        </>
      ) : (
        <WelcomeSplash onSignIn={() => setShowLoginModal(true)} />
      )}

      {/* ── Footer ── */}
      <Footer />

      {/* ── Login Modal ── */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  )
}

/* ── Welcome Splash ── */
function WelcomeSplash({ onSignIn }) {
  return (
    <div className="welcome-splash">
      <div className="welcome-icon">📈</div>
      <h1 className="welcome-title">Welcome to SwingRadar</h1>
      <p className="welcome-desc">
        Your personalized destination for daily NSE swing trading picks. 
        Please sign in securely to unlock your dashboard and save preferences.
      </p>
      
      <div className="how-it-works">
        <h3>How We Pick Stocks</h3>
        <p>
          SwingRadar utilizes advanced proprietary algorithms to analyze vast amounts of market data daily. 
          By combining intelligent momentum detection with strict risk-to-reward filters, we bring you a curated
          selection of the highest-probability trading opportunities across the NSE, saving you hours of manual research.
        </p>
      </div>

      <button className="btn btn-primary welcome-btn" onClick={onSignIn}>
        Sign In to Continue
      </button>
    </div>
  )
}
