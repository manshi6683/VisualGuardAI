
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ScanSearch, History, Image, Settings,
  Bell, Search, Plus, ArrowUpRight, CheckCircle2,
  AlertTriangle, Clock3, GitCompareArrows, Globe,
  Monitor, Smartphone, ChevronDown, Activity,
  Zap, ShieldCheck, ExternalLink, Menu, X, FileBarChart
} from 'lucide-react'
import TestRuns from './pages/TestRuns'
import Comparison from './pages/Comparison'
import Reports from './pages/Reports'
import CrossBrowser from './pages/CrossBrowser'
import { getScanHistory } from './services/api'
import SettingsPage from './pages/Settings'

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'New Scan', icon: ScanSearch },
  { name: 'Comparison', icon: Image },
  { name: 'Cross-Browser', icon: Globe },
  { name: 'Scan History', icon: History },
  { name: 'Reports', icon: FileBarChart },
]

function App() {
  const [profileName, setProfileName] = useState('QA Tester')
  const [searchQuery, setSearchQuery] = useState('')
  const [scans, setScans] = useState([])
  const [analytics, setAnalytics] = useState({
    dailyActivity: [],
    distribution: {
      passed: 0,
      failed: 0,
      pending: 0
    }
  })
  const [stats, setStats] = useState([
    { label: 'TOTAL SCANS', value: '—', change: 'Loading database', icon: ScanSearch, color: 'cyan' },
    { label: 'TESTS PASSED', value: '—', change: 'Loading database', icon: CheckCircle2, color: 'green' },
    { label: 'VISUAL ISSUES', value: '—', change: 'Loading database', icon: AlertTriangle, color: 'violet' },
    { label: 'PASS RATE', value: '—', change: 'Loading database', icon: Activity, color: 'orange' },
  ])

  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stats')
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to load dashboard stats')
        }

        const data = result.data

        setStats([
          {
            label: 'TOTAL SCANS',
            value: String(data.totalScans),
            change: 'Live database',
            icon: ScanSearch,
            color: 'cyan'
          },
          {
            label: 'TESTS PASSED',
            value: String(data.passedScans),
            change: 'Passed comparisons',
            icon: CheckCircle2,
            color: 'green'
          },
          {
            label: 'VISUAL ISSUES',
            value: String(data.visualIssues),
            change: `${data.failedScans} failed scans`,
            icon: AlertTriangle,
            color: 'violet'
          },
          {
            label: 'PASS RATE',
            value: `${data.passRate}%`,
            change: 'Overall success rate',
            icon: Activity,
            color: 'orange'
          }
        ])

        setStatsError('')
      } catch (error) {
        setStatsError(error.message)
      }
    }

    loadStats()
  }, [])
  useEffect(() => {
    const loadScans = async () => {
      try {
        const data = await getScanHistory()

        const formattedScans = data.map((scan) => ({
          id: scan.id,
          name: scan.title || new URL(scan.url).hostname,
          url: scan.url,
          date: scan.created_at
            ? new Date(scan.created_at).toLocaleString()
            : 'N/A',
          difference:
            scan.difference_percentage != null
              ? `${Number(scan.difference_percentage).toFixed(2)}%`
              : 'Not compared',
          status: scan.status || 'Captured'
        }))

        setScans(formattedScans)
      } catch (error) {
        console.error('Unable to load recent scans:', error)
      }
    }

    loadScans()
  }, [])
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [url, setUrl] = useState('')
  const [viewport, setViewport] = useState('Desktop')
  const [browserType, setBrowserType] = useState('chromium')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [topProfileOpen, setTopProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Welcome to VisualGuard AI',
      message: 'Your QA workspace is ready.',
      time: 'Just now',
      read: false,
    },
    {
      id: 2,
      title: 'Testing Engine Active',
      message: 'Your visual testing engine is running.',
      time: 'Just now',
      read: false,
    },
  ])
  const [message, setMessage] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [capture, setCapture] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [isComparing, setIsComparing] = useState(false)

  useEffect(() => {
    if (!profileMenuOpen) return

    const handleOutsideClick = (event) => {
      if (!event.target.closest('.profile-wrapper')) {
        setProfileMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [profileMenuOpen])
  useEffect(() => {
    if (!notificationsOpen) return

    const handleOutsideClick = (event) => {
      if (
        !event.target.closest('.notification-dropdown') &&
        !event.target.closest('.notification-button')
      ) {
        setNotificationsOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [notificationsOpen])
  const refreshDashboardData = async () => {
    try {
      // Refresh dashboard statistics
      const statsResponse = await fetch('http://localhost:5000/api/stats')
      const statsResult = await statsResponse.json()

      if (!statsResponse.ok || !statsResult.success) {
        throw new Error('Unable to refresh dashboard stats')
      }

      const data = statsResult.data

      setStats([
        {
          label: 'TOTAL SCANS',
          value: String(data.totalScans),
          change: 'Live database',
          icon: ScanSearch,
          color: 'cyan'
        },
        {
          label: 'TESTS PASSED',
          value: String(data.passedScans),
          change: 'Passed comparisons',
          icon: CheckCircle2,
          color: 'green'
        },
        {
          label: 'VISUAL ISSUES',
          value: String(data.visualIssues),
          change: `${data.failedScans} failed scans`,
          icon: AlertTriangle,
          color: 'violet'
        },
        {
          label: 'PASS RATE',
          value: `${data.passRate}%`,
          change: 'Overall success rate',
          icon: Activity,
          color: 'orange'
        }
      ])

      // Refresh recent scan history
      const history = await getScanHistory()

      setScans(history.map((scan) => ({
        id: scan.id,
        name: scan.title || new URL(scan.url).hostname,
        url: scan.url,
        date: scan.created_at
          ? new Date(scan.created_at).toLocaleString()
          : 'N/A',
        difference: scan.difference_percentage != null
          ? `${Number(scan.difference_percentage).toFixed(2)}%`
          : 'Not compared',
        status: scan.status || 'Captured'
      })))

    } catch (error) {
      console.error('Dashboard refresh failed:', error)
    }
  }

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/analytics')
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error('Unable to load analytics')
        }

        setAnalytics(result.data)
      } catch (error) {
        console.error('Analytics loading failed:', error)
      }
    }

    loadAnalytics()
  }, [])
  const startScan = async () => {
    if (!url.trim()) {
      setMessage('Please enter a website URL first.')
      return
    }

    setIsScanning(true)
    setCapture(null)
    setMessage('Launching Playwright browser...')

    try {
      const response = await fetch('http://localhost:5000/api/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          viewport,
          browserType
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Screenshot capture failed')
      }

      setCapture(result.data)
      setMessage('Screenshot captured successfully!')
      await refreshDashboardData()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsScanning(false)
    }
  }


  const saveBaseline = async () => {
    if (!capture?.filename) {
      setMessage('Capture a screenshot first.')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFilename: capture.filename,
          projectName: 'VisualGuard_Project'
        })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message)

      setBaseline(result.data.baselineFilename)
      setComparison(null)
      setMessage('Baseline saved successfully!')
    } catch (error) {
      setMessage(error.message)
    }
  }

  const runComparison = async () => {
    if (!baseline || !capture?.filename) {
      setMessage('Save a baseline and capture a new screenshot first.')
      return
    }

    setIsComparing(true)

    try {
      const response = await fetch('http://localhost:5000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baselineFilename: baseline,
          currentFilename: capture.filename
        })
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message)

      setComparison(result.data)
      setMessage('Visual comparison completed!')
      await refreshDashboardData()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsComparing(false)
    }
  }


  const selectTab = (tab) => {
    setActiveTab(tab)
    setMenuOpen(false)
    setMessage('')
  }
  // Prepare last 7 days of chart data
  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - (6 - index))

    const dateKey = date.toISOString().slice(0, 10)

    const dayData = analytics.dailyActivity.find(
      (item) => item.date === dateKey
    )

    return {
      date: dateKey,
      day: date.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'UTC'
      }).toUpperCase(),
      scans: dayData?.totalScans || 0,
      issues: dayData?.visualIssues || 0
    }
  })

  const maxChartValue = Math.max(
    5,
    ...chartData.map((item) => Math.max(item.scans, item.issues))
  )
  const distribution = analytics.distribution

  const totalTests =
    distribution.passed +
    distribution.failed +
    distribution.pending

  const passedPercent = totalTests
    ? (distribution.passed / totalTests) * 100
    : 0

  const failedPercent = totalTests
    ? (distribution.failed / totalTests) * 100
    : 0

  const pendingPercent = totalTests
    ? (distribution.pending / totalTests) * 100
    : 0
  const filteredScans = scans.filter((scan) => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return true

    return (
      scan.name?.toLowerCase().includes(query) ||
      scan.url?.toLowerCase().includes(query) ||
      String(scan.id).includes(query) ||
      scan.status?.toLowerCase().includes(query)
    )
  })
  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">
            <GitCompareArrows size={23} />
          </div>
          <div className="brand-text">
            <h2>VISUAL<span>GUARD</span></h2>
            <small>AI TESTING ENGINE</small>
          </div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)}>
            <X size={19} />
          </button>
        </div>

        <div className="workspace-tag">
          <span className="online-dot" />
          SYSTEM ONLINE
        </div>

        <p className="nav-heading">MAIN MENU</p>

        <nav className="navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-link ${activeTab === name ? 'nav-active' : ''}`}
              onClick={() => selectTab(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === 'New Scan' && <span className="nav-plus">+</span>}
            </button>
          ))}
        </nav>

        <p className="nav-heading preferences-heading">SYSTEM</p>

        <button className="nav-link" onClick={() => selectTab('Settings')}>
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <div className="sidebar-spacer" />

        <div className="system-card">
          <div className="system-card-icon"><ShieldCheck size={21} /></div>
          <div>
            <h4>Protection Active</h4>
            <p>Your QA workspace is ready.</p>
          </div>
          <span className="system-pulse" />
        </div>

        <div className="profile-wrapper">
          <button
            className="profile"
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-expanded={profileMenuOpen}
          >
            <div className="profile-avatar">M</div>

            <div className="profile-info">
              <strong>{profileName}</strong>
              <small>Administrator</small>
            </div>

            <ChevronDown size={17} />
          </button>

          {profileMenuOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <strong>{profileName}</strong>
                <small>Administrator</small>
              </div>

              <button
                type="button"
                onClick={() => {
                  selectTab('Settings')
                  setProfileMenuOpen(false)
                }}
              >
                <Settings size={16} />
                Profile Settings
              </button>

              <div className="profile-role">
                <ShieldCheck size={16} />
                Administrator Account
              </div>
            </div>
          )}

        </div>
      </aside>

      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

      {/* MAIN AREA */}
      <main className="main-area">

        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMenuOpen(true)}>
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              WORKSPACE <span>/</span> <strong>{activeTab.toUpperCase()}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <div className="global-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}

              {!searchQuery && <kbd>⌘ K</kbd>}
            </div>

            <button
              className="notification-button"
              type="button"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              <Bell size={19} />
              <span />
            </button>

            {notificationsOpen && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <div>
                    <h3>Notifications</h3>
                    <span>
                      {notifications.filter((item) => !item.read).length} unread
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <p className="empty-notifications">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`notification-item ${item.read ? 'read' : 'unread'}`}
                      >
                        <div className="notification-icon">
                          <Bell size={16} />
                        </div>

                        <div className="notification-content">
                          <strong>{item.title}</strong>
                          <p>{item.message}</p>
                          <small>{item.time}</small>
                        </div>

                        {!item.read && <span className="unread-dot" />}
                      </div>
                    ))
                  )}
                </div>

                <div className="notification-footer">
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications((previous) =>
                        previous.map((item) => ({ ...item, read: true }))
                      )
                    }
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}

            <div className="top-profile-wrapper">
              <button
                type="button"
                className="top-profile"
                onClick={() => setTopProfileOpen((prev) => !prev)}
                aria-expanded={topProfileOpen}
                aria-label="Open profile menu"
              >
                M
              </button>

              {topProfileOpen && (
                <div className="top-profile-dropdown">
                  <div className="top-profile-info">
                    <strong>{profileName}</strong>
                    <small>Administrator</small>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      selectTab('Settings')
                      setTopProfileOpen(false)
                    }}
                  >
                    <Settings size={16} />
                    Profile Settings
                  </button>

                  <div className="top-profile-role">
                    <ShieldCheck size={16} />
                    Administrator Account
                  </div>
                </div>
              )}
            </div>
          </div>

        </header>
        <div className="dashboard-content">

          {/* PAGE HEADING */}
          <section className="page-heading">
            <div>
              <div className="section-kicker">
                <span className="kicker-line" />
                QUALITY CONTROL CENTER
              </div>
              <h1>
                {activeTab === 'Dashboard' ? (
                  <>Visual Testing <span>Dashboard - TEST CHANGE</span></>
                ) : (
                  <>{activeTab}<span>.</span></>
                )}
              </h1>
              <p>Detect visual bugs. Compare interfaces. Ship with confidence.</p>
            </div>

            <button className="neon-button" onClick={() => selectTab('New Scan')}>
              <Plus size={18} /> NEW SCAN
            </button>
          </section>

          {activeTab === 'Scan History' ? (
            <TestRuns />
          ) : activeTab === 'Comparison' ? (
            <Comparison />
          ) : activeTab === 'Reports' ? (
            <Reports />
          ) : activeTab === 'Cross-Browser' ? (
            <CrossBrowser />
          ) : activeTab === 'Settings' ? (
            <SettingsPage onSave={setProfileName} />
          ) : (
            <>
              {/* STATS */}
              <section className="stats-grid">
                {stats.map(({ label, value, change, icon: Icon, color }) => (
                  <article className={`stat-card ${color}`} key={label}>
                    <div className="stat-header">
                      <div className="stat-icon"><Icon size={20} /></div>
                      <span className="stat-label">{label}</span>
                      <ArrowUpRight size={15} className="stat-arrow" />
                    </div>
                    <h2>{value}</h2>
                    <div className="stat-footer">
                      <span className="stat-change">{change}</span>
                      <span className="stat-period">vs last month</span>
                    </div>
                    <div className="stat-glow" />
                  </article>
                ))}
              </section>

              {/* SCANNER */}
              <section className="scanner-panel">
                <div className="panel-heading">
                  <div>
                    <div className="section-kicker">
                      <Zap size={13} /> AUTOMATED SCANNER
                    </div>
                    <h2>Initialize Visual Scan</h2>
                    <p>Enter a website to prepare a visual regression comparison.</p>
                  </div>
                  <div className="scanner-status">
                    <span className="online-dot" /> ENGINE READY
                  </div>
                </div>

                <div className="scanner-input-row">
                  <div className="website-input">
                    <Globe size={19} />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        setMessage('')
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && startScan()}
                      placeholder="https://your-website.com"
                    />
                    <span className="input-secure"><ShieldCheck size={15} /> URL</span>
                  </div>

                  <div className="viewport-control">
                    <Monitor size={17} />
                    <select value={viewport} onChange={(e) => setViewport(e.target.value)}>
                      <option>Desktop</option>
                      <option>Tablet</option>
                      <option>Mobile</option>
                    </select>
                    <ChevronDown size={14} />
                  </div>
                  <div className="viewport-control">
                    <Globe size={17} />
                    <select
                      value={browserType}
                      onChange={(e) => setBrowserType(e.target.value)}
                    >
                      <option value="chromium">Chromium</option>
                      <option value="firefox">Firefox</option>
                      <option value="webkit">WebKit (Safari)</option>
                    </select>
                    <ChevronDown size={14} />
                  </div>

                  <button className="scan-button" onClick={startScan}>
                    <ScanSearch size={18} /> INITIALIZE <ArrowUpRight size={16} />
                  </button>
                </div>

                {message && <p className="scan-message">{message}</p>}
                {isScanning && (
                  <div className="capture-loading">
                    <Activity size={20} />
                    Capturing website screenshot...
                  </div>
                )}

                {capture && (
                  <div className="capture-result">
                    <div className="capture-result-header">
                      <div>
                        <h3>Screenshot Captured</h3>
                        <p>{capture.title || capture.url}</p>
                      </div>
                      <span className="result-badge passed">SUCCESS</span>
                    </div>

                    <img
                      src={`http://localhost:5000${capture.screenshot}`}
                      alt="Captured website screenshot"
                      className="captured-image"
                    />

                    <div className="capture-details">
                      <span>Browser: {capture.browserType || browserType}</span>
                      <span>Viewport: {capture.viewport}</span>
                      <span>
                        {capture.dimensions.width} × {capture.dimensions.height}
                      </span>
                    </div>

                    <div className="baseline-actions">
                      <button onClick={saveBaseline} className="neon-button">
                        Save as Baseline
                      </button>

                      <button
                        onClick={runComparison}
                        className="scan-button"
                        disabled={!baseline || isComparing}
                      >
                        {isComparing ? 'COMPARING...' : 'Compare with Baseline'}
                      </button>
                    </div>

                    {baseline && (
                      <p className="scan-message">
                        Baseline saved: {baseline}
                      </p>
                    )}

                    {comparison && (
                      <div className="comparison-results">
                        <h3>Visual Comparison Results</h3>

                        <div className="comparison-metrics">
                          <div>
                            <span>Similarity</span>
                            <strong>{comparison.similarityPercentage}%</strong>
                          </div>

                          <div>
                            <span>Difference</span>
                            <strong>{comparison.differencePercentage}%</strong>
                          </div>

                          <div>
                            <span>Changed Pixels</span>
                            <strong>{comparison.differentPixels}</strong>
                          </div>
                        </div>

                        <div className="comparison-image">
                          <h4>Difference Image</h4>
                          <img
                            src={`http://localhost:5000${comparison.differenceImage}`}
                            alt="Visual differences highlighted"
                          />
                        </div>

                        <span className={`result-badge ${comparison.passed ? 'passed' : 'failed'}`}>
                          {comparison.passed ? 'VISUAL TEST PASSED' : 'VISUAL TEST FAILED'}
                        </span>
                      </div>
                    )}

                  </div>
                )}

                <div className="scanner-features">
                  <span><CheckCircle2 size={15} /> PIXEL COMPARISON</span>
                  <span><Smartphone size={15} /> RESPONSIVE ANALYSIS</span>
                  <span><Activity size={15} /> CHANGE DETECTION</span>
                </div>
              </section>

              {/* ANALYTICS */}
              <section className="analytics-grid">
                <article className="analytics-card">
                  <div className="analytics-heading">
                    <div>
                      <span className="section-kicker">PERFORMANCE</span>
                      <h3>Testing Activity</h3>
                    </div>
                    <span className="period-tag">LAST 7 DAYS</span>
                  </div>

                  <div className="chart-area">
                    <div className="chart-y-labels">
                      {[4, 3, 2, 1, 0].map((step) => (
                        <span key={step}>
                          {Math.round((maxChartValue * step) / 4)}
                        </span>
                      ))}
                    </div>
                    <div className="chart-main">
                      <div className="chart-grid-lines">
                        <i /><i /><i /><i /><i />
                      </div>
                      <svg
                        viewBox="0 0 600 170"
                        preserveAspectRatio="none"
                        className="activity-chart"
                      >
                        <defs>
                          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00e5ff" stopOpacity=".23" />
                            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {(() => {
                          const getY = (value) =>
                            150 - (value / maxChartValue) * 130

                          const getX = (index) =>
                            (index / 6) * 600

                          const scanPoints = chartData.map(
                            (item, index) => `${getX(index)},${getY(item.scans)}`
                          ).join(' ')

                          const issuePoints = chartData.map(
                            (item, index) => `${getX(index)},${getY(item.issues)}`
                          ).join(' ')

                          const scanArea =
                            `M${getX(0)} ${getY(chartData[0].scans)} ` +
                            chartData.slice(1).map((item, index) =>
                              `L${getX(index + 1)} ${getY(item.scans)}`
                            ).join(' ') +
                            ' L600 170 L0 170 Z'

                          return (
                            <>
                              <path d={scanArea} fill="url(#chartFill)" />

                              <polyline
                                points={scanPoints}
                                fill="none"
                                stroke="#00e5ff"
                                strokeWidth="3"
                                vectorEffect="non-scaling-stroke"
                              />

                              <polyline
                                points={issuePoints}
                                fill="none"
                                stroke="#9b70ff"
                                strokeWidth="2"
                                strokeDasharray="5 5"
                                vectorEffect="non-scaling-stroke"
                              />
                            </>
                          )
                        })()}
                      </svg>
                      <div className="chart-x-labels">
                        {chartData.map((item) => (
                          <span key={item.date}>{item.day}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="chart-legend">
                    <span><i className="legend-cyan" /> SCANS EXECUTED</span>
                    <span><i className="legend-violet" /> VISUAL ISSUES</span>
                  </div>
                </article>

                <article className="analytics-card distribution-card">
                  <div className="analytics-heading">
                    <div>
                      <span className="section-kicker">QUALITY METRICS</span>
                      <h3>Test Distribution</h3>
                    </div>
                  </div>

                  <div className="donut-layout">
                    <div
                      className="donut-chart"
                      style={{
                        background: `conic-gradient(
        #00dba5 0% ${passedPercent}%,
        #9b70ff ${passedPercent}% ${passedPercent + failedPercent}%,
        #ffad5c ${passedPercent + failedPercent}% 100%
      )`
                      }}
                    >
                      <div className="donut-center">
                        <strong>{totalTests}</strong>
                        <small>TOTAL TESTS</small>
                      </div>
                    </div>

                    <div className="donut-legend">
                      <div>
                        <i className="legend-green" />
                        <span>Passed</span>
                        <strong>{passedPercent.toFixed(0)}%</strong>
                      </div>

                      <div>
                        <i className="legend-violet" />
                        <span>Failed</span>
                        <strong>{failedPercent.toFixed(0)}%</strong>
                      </div>

                      <div>
                        <i className="legend-orange" />
                        <span>Pending</span>
                        <strong>{pendingPercent.toFixed(0)}%</strong>
                      </div>
                    </div>
                  </div>
                </article>
              </section>

              {/* RECENT SCANS */}
              <section className="history-panel">
                <div className="history-heading">
                  <div>
                    <span className="section-kicker">ACTIVITY LOG</span>
                    <h2>Recent Visual Tests</h2>
                    <p>Track your latest website comparison results.</p>
                  </div>
                  <button className="view-all-button" onClick={() => selectTab('Scan History')}>
                    VIEW ALL <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="table-container">
                  <table className="scan-table">
                    <thead>
                      <tr>
                        <th>WEBSITE / PROJECT</th>
                        <th>LAST EXECUTION</th>
                        <th>PIXEL DIFFERENCE</th>
                        <th>RESULT</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScans.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '25px' }}>
                            No matching scans found.
                          </td>
                        </tr>
                      )}
                      {filteredScans.map((scan) => (
                        <tr key={scan.id}>
                          <td>
                            <div className="website-cell">
                              <div className="website-logo"><Globe size={17} /></div>
                              <div>
                                <strong>{scan.name}</strong>
                                <small>{scan.url}</small>
                              </div>
                            </div>
                          </td>
                          <td className="date-cell">{scan.date}</td>
                          <td className="difference-cell">{scan.difference}</td>
                          <td>
                            <span className={`result-badge ${scan.status.toLowerCase()}`}>
                              {scan.status === 'Passed' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                              {scan.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button className="table-action" onClick={() => selectTab('Comparison')}>
                              <ExternalLink size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <footer className="dashboard-footer">
                <span>VISUALGUARD AI <span className="footer-dot">●</span> VERSION 1.0</span>
                <span>ENGINEERED FOR VISUAL PERFECTION <Zap size={12} /></span>
              </footer>
            </>
          )}

        </div>
      </main>
    </div>
  )
}

export default App
