
import { useEffect, useState } from 'react'
import {
    History,
    Globe,
    Monitor,
    RefreshCw,
    Eye,
    CheckCircle2,
    AlertTriangle,
    Search,
    Trash2,
    Download
} from 'lucide-react'

const API_URL = 'http://localhost:5000'

function CrossBrowserHistory() {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedTest, setSelectedTest] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [recordsPerPage, setRecordsPerPage] = useState(5)
    const [searchTerm, setSearchTerm] = useState('')
    const [viewportFilter, setViewportFilter] = useState('All')

    const loadHistory = async () => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch(
                `${API_URL}/api/cross-browser-history`
            )

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Unable to load history')
            }

            setHistory(result.data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }
    const deleteHistory = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this comparison record?'
        )

        if (!confirmed) return

        setDeletingId(id)

        try {
            const response = await fetch(
                `${API_URL}/api/cross-browser-history/${id}`,
                { method: 'DELETE' }
            )

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Unable to delete history')
            }

            setHistory(prev => prev.filter(item => item.id !== id))

            if (selectedTest?.id === id) {
                setSelectedTest(null)
            }

        } catch (err) {
            alert(err.message)
        } finally {
            setDeletingId(null)
        }
    }
    useEffect(() => {
        loadHistory()
    }, [])
    const filteredHistory = history.filter(item => {
        const matchesSearch = item.url
            .toLowerCase()
            .includes(searchTerm.toLowerCase())

        const matchesViewport =
            viewportFilter === 'All' ||
            item.viewport === viewportFilter

        return matchesSearch && matchesViewport
    })
    const totalPages = Math.ceil(
        filteredHistory.length / recordsPerPage
    )

    const startIndex = (currentPage - 1) * recordsPerPage

    const paginatedHistory = filteredHistory.slice(
        startIndex,
        startIndex + recordsPerPage
    )

    const startRecord = filteredHistory.length === 0
        ? 0
        : startIndex + 1

    const endRecord = Math.min(
        startIndex + recordsPerPage,
        filteredHistory.length
    )
    const exportCSV = () => {
        if (filteredHistory.length === 0) {
            alert('No history records available to export.')
            return
        }

        const headers = [
            'Test ID',
            'Website URL',
            'Viewport',
            'Firefox Similarity (%)',
            'Firefox Difference (%)',
            'Firefox Changed Pixels',
            'Firefox Result',
            'WebKit Similarity (%)',
            'WebKit Difference (%)',
            'WebKit Changed Pixels',
            'WebKit Result',
            'Test Date'
        ]

        const rows = filteredHistory.map(item => [
            item.id,
            item.url,
            item.viewport,
            item.firefox_similarity,
            item.firefox_difference,
            item.firefox_changed_pixels,
            item.firefox_passed === 1 ? 'Passed' : 'Failed',
            item.webkit_similarity,
            item.webkit_difference,
            item.webkit_changed_pixels,
            item.webkit_passed === 1 ? 'Passed' : 'Failed',
            item.created_at
        ])

        const escapeCSV = value => {
            const text = value == null ? '' : String(value)
            return `"${text.replace(/"/g, '""')}"`
        }

        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n')

        const blob = new Blob(
            ['\uFEFF' + csvContent],
            { type: 'text/csv;charset=utf-8;' }
        )

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = `VisualGuard_CrossBrowser_History_${Date.now()}.csv`

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
    }
    return (
        <section className="cross-history">

            <div className="cross-history-header">
                <div>
                    <span className="section-kicker">
                        <History size={14} /> TEST ARCHIVE
                    </span>
                    <h2>Cross-Browser History</h2>
                    <p>Review previously executed browser comparisons.</p>
                </div>

                <div className="cross-history-header-actions">

                    <button
                        className="history-export-button"
                        onClick={exportCSV}
                        disabled={filteredHistory.length === 0}
                    >
                        <Download size={16} />
                        EXPORT CSV
                    </button>

                    <button
                        className="history-refresh"
                        onClick={loadHistory}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        REFRESH
                    </button>

                </div>
            </div>

            <div className="cross-history-summary">
                <div>
                    <span>Total Comparisons</span>
                    <strong>{history.length}</strong>
                </div>

                <div>
                    <span>Firefox Tests</span>
                    <strong>
                        {history.filter(item => item.firefox_similarity !== null).length}
                    </strong>
                </div>

                <div>
                    <span>WebKit Tests</span>
                    <strong>
                        {history.filter(item => item.webkit_similarity !== null).length}
                    </strong>
                </div>
            </div>
            {/* SEARCH AND FILTER */}
            <div className="cross-history-controls">

                <div className="cross-history-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search website URL..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    value={viewportFilter}
                    onChange={e => setViewportFilter(e.target.value)}
                    className="cross-history-filter"
                >
                    <option value="All">All Viewports</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Mobile">Mobile</option>
                </select>

            </div>
            {error && (
                <div className="cross-history-empty">
                    <AlertTriangle size={18} /> {error}
                </div>
            )}

            {loading ? (
                <div className="cross-history-empty">
                    Loading cross-browser history...
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="cross-history-empty">
                    No cross-browser tests found. Run your first comparison.
                </div>
            ) : (
                <>
                    <div className="cross-history-table-wrapper">
                        <table className="cross-history-table">
                            <thead>
                                <tr>
                                    <th>WEBSITE</th>
                                    <th>VIEWPORT</th>
                                    <th>FIREFOX</th>
                                    <th>WEBKIT</th>
                                    <th>DATE</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedHistory.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="cross-history-website">
                                                <Globe size={17} />
                                                <span>{item.url}</span>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="cross-history-viewport">
                                                <Monitor size={14} />
                                                {item.viewport}
                                            </span>
                                        </td>

                                        <td>
                                            {item.firefox_similarity !== null
                                                ? `${item.firefox_similarity}%`
                                                : 'N/A'}
                                        </td>

                                        <td>
                                            {item.webkit_similarity !== null
                                                ? `${item.webkit_similarity}%`
                                                : 'N/A'}
                                        </td>

                                        <td>
                                            {new Date(
                                                `${item.created_at.replace(' ', 'T')}Z`
                                            ).toLocaleString()}
                                        </td>

                                        <td>
                                            <div className="cross-history-actions">

                                                <button
                                                    className="history-view-button"
                                                    onClick={() => setSelectedTest(item)}
                                                    title="View test details"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    className="history-delete-button"
                                                    onClick={() => deleteHistory(item.id)}
                                                    disabled={deletingId === item.id}
                                                    title="Delete history record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="cross-history-pagination">

                        <div className="pagination-info">
                            Showing <strong>{startRecord}-{endRecord}</strong> of{' '}
                            <strong>{filteredHistory.length}</strong> records
                        </div>

                        <div className="pagination-controls">

                            <select
                                value={recordsPerPage}
                                onChange={e => {
                                    setRecordsPerPage(Number(e.target.value))
                                    setCurrentPage(1)
                                }}
                                className="pagination-size"
                            >
                                <option value={5}>5 / page</option>
                                <option value={10}>10 / page</option>
                                <option value={20}>20 / page</option>
                            </select>

                            <button
                                className="pagination-button"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Previous
                            </button>

                            <span className="pagination-page">
                                Page {currentPage} of {Math.max(totalPages, 1)}
                            </span>

                            <button
                                className="pagination-button"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Next
                            </button>

                        </div>

                    </div>
                </>
            )}

            {selectedTest && (
                <div className="cross-history-modal-overlay">
                    <div className="cross-history-modal">

                        <div className="cross-history-modal-header">
                            <div>
                                <span className="section-kicker">
                                    COMPARISON DETAILS
                                </span>
                                <h3>Test #{selectedTest.id}</h3>
                            </div>

                            <button
                                onClick={() => setSelectedTest(null)}
                                className="cross-history-close"
                            >
                                ×
                            </button>
                        </div>

                        <p className="cross-history-modal-url">
                            {selectedTest.url}
                        </p>

                        <div className="cross-history-images">
                            {[
                                ['Chromium', selectedTest.chromium_screenshot],
                                ['Firefox', selectedTest.firefox_screenshot],
                                ['WebKit', selectedTest.webkit_screenshot],
                                ['Firefox Difference', selectedTest.firefox_difference_image],
                                ['WebKit Difference', selectedTest.webkit_similarity != null
                                    ? selectedTest.webkit_difference_image
                                    : null]
                            ].map(([name, imagePath]) => (
                                <div key={name}>
                                    <h4>{name}</h4>
                                    {imagePath ? (
                                        <a
                                            href={`${API_URL}${imagePath}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <img
                                                src={`${API_URL}${imagePath}`}
                                                alt={name}
                                            />
                                        </a>
                                    ) : (
                                        <p>
                                            {name === 'WebKit Difference'
                                                ? 'Not generated — screenshot dimensions differ.'
                                                : 'Image unavailable'}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="cross-history-modal-metrics">

                            {/* FIREFOX METRICS */}
                            <div className="browser-metric-group">
                                <h4>Firefox Comparison</h4>

                                <div className="browser-metric">
                                    <span>Similarity</span>
                                    <strong>
                                        {selectedTest.firefox_similarity != null
                                            ? `${selectedTest.firefox_similarity}%`
                                            : 'N/A'}
                                    </strong>
                                </div>

                                <div className="browser-metric">
                                    <span>Difference</span>
                                    <strong>
                                        {selectedTest.firefox_difference != null
                                            ? `${selectedTest.firefox_difference}%`
                                            : 'N/A'}
                                    </strong>
                                </div>

                                <div className="browser-metric">
                                    <span>Changed Pixels</span>
                                    <strong>
                                        {selectedTest.firefox_changed_pixels?.toLocaleString() ?? 'N/A'}
                                    </strong>
                                </div>

                                <div className="browser-metric">
                                    <span>Comparison Result</span>
                                    <strong className={
                                        selectedTest.firefox_passed === 1 ? 'metric-pass' : 'metric-fail'
                                    }>
                                        {selectedTest.firefox_passed === null
                                            ? 'N/A'
                                            : selectedTest.firefox_passed === 1
                                                ? 'Passed'
                                                : 'Failed'}
                                    </strong>
                                </div>
                            </div>

                            {/* WEBKIT METRICS */}
                            <div className="browser-metric-group">
                                <h4>WebKit Comparison</h4>

                                <div className="browser-metric">
                                    <span>Similarity</span>
                                    <strong>
                                        {selectedTest.webkit_similarity != null
                                            ? `${selectedTest.webkit_similarity}%`
                                            : 'N/A'}
                                    </strong>
                                </div>

                                <div className="browser-metric">
                                    <span>Difference</span>
                                    <strong>
                                        {selectedTest.webkit_difference != null
                                            ? `${selectedTest.webkit_difference}%`
                                            : 'N/A'}
                                    </strong>
                                </div>

                                <div className="browser-metric">
                                    <span>Changed Pixels</span>
                                    <strong>
                                        {selectedTest.webkit_changed_pixels?.toLocaleString() ?? 'N/A'}
                                    </strong>
                                </div>

                                <div className="browser-metric">
                                    <span>Comparison Result</span>
                                    <strong className={
                                        selectedTest.webkit_passed === 1 ? 'metric-pass' : 'metric-fail'
                                    }>
                                        {selectedTest.webkit_passed === null
                                            ? 'N/A'
                                            : selectedTest.webkit_passed === 1
                                                ? 'Passed'
                                                : 'Failed'}
                                    </strong>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            )}

        </section>
    )
}

export default CrossBrowserHistory
