
import { useState } from 'react'
import CrossBrowserHistory from './CrossBrowserHistory'
import {
    Globe,
    Monitor,
    Tablet,
    Smartphone,
    Play,
    LoaderCircle,
    CheckCircle2,
    AlertTriangle,
    Image as ImageIcon
} from 'lucide-react'

const API_URL = 'http://localhost:5000'

function CrossBrowser() {
    const [url, setUrl] = useState('')
    const [viewport, setViewport] = useState('Desktop')
    const [results, setResults] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const runComparison = async () => {
        if (!url.trim()) {
            setError('Please enter a website URL.')
            return
        }

        setLoading(true)
        setError('')
        setResults(null)

        try {
            const response = await fetch(
                `${API_URL}/api/cross-browser-compare`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url, viewport })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Comparison failed')
            }

            setResults(data.data)
        } catch (err) {
            setError(err.message || 'Unable to compare browsers.')
        } finally {
            setLoading(false)
        }
    }

    const browserNames = {
        chromium: 'Chromium',
        firefox: 'Firefox',
        webkit: 'WebKit (Safari)'
    }

    const viewportIcons = {
        Desktop: Monitor,
        Tablet: Tablet,
        Mobile: Smartphone
    }

    const ViewportIcon = viewportIcons[viewport]
    const domResults = results?.results?.filter(
        item => item.domComparison
    ) || []

    const overallDOMStatus = domResults.some(
        item => item.domComparison.status === 'FAILED'
    )
        ? 'FAILED'
        : domResults.some(
            item => item.domComparison.status === 'WARNING'
        )
            ? 'WARNING'
            : domResults.length > 0 &&
                domResults.every(
                    item => item.domComparison.status === 'PASSED'
                )
                ? 'PASSED'
                : 'UNAVAILABLE'
    return (
        <section className="cross-browser-page">

            <div className="cross-browser-intro">
                <div>
                    <span className="section-kicker">
                        <Globe size={14} /> MULTI-BROWSER ENGINE
                    </span>
                    <h2>Cross-Browser Testing</h2>
                    <p>
                        Compare website rendering across Chromium, Firefox
                        and WebKit using pixel-level analysis.
                    </p>
                </div>

                <div className="cross-browser-status">
                    <span className="online-dot" />
                    ENGINE READY
                </div>
            </div>

            <div className="cross-browser-form">

                <div className="cross-browser-url">
                    <Globe size={19} />
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && runComparison()}
                        placeholder="https://your-website.com"
                    />
                </div>

                <div className="cross-browser-viewport">
                    <ViewportIcon size={18} />
                    <select
                        value={viewport}
                        onChange={(e) => setViewport(e.target.value)}
                    >
                        <option value="Desktop">Desktop</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Mobile">Mobile</option>
                    </select>
                </div>

                <button
                    className="cross-browser-run"
                    onClick={runComparison}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <LoaderCircle size={18} className="cross-browser-spinner" />
                            TESTING...
                        </>
                    ) : (
                        <>
                            <Play size={17} />
                            RUN COMPARISON
                        </>
                    )}
                </button>

            </div>

            {error && (
                <div className="cross-browser-error">
                    <AlertTriangle size={17} />
                    {error}
                </div>
            )}

            {loading && (
                <div className="cross-browser-loading">
                    <LoaderCircle size={25} className="cross-browser-spinner" />
                    <h3>Running cross-browser tests...</h3>
                    <p>Capturing screenshots and comparing browser rendering.</p>
                </div>
            )}

            {results && (
                <div className="cross-browser-results">

                    <div className="cross-browser-results-heading">
                        <div>
                            <h3>Comparison Results</h3>
                            <p>{results.url}</p>
                        </div>
                        <span className="cross-browser-viewport-tag">
                            <Monitor size={14} />
                            {results.viewport}
                        </span>
                    </div>

                    <div className="cross-browser-summary">
                        <div>
                            <span>Browsers Tested</span>
                            <strong>
                                {results.results.filter(item => item.success).length}/3
                            </strong>
                        </div>
                        <div>
                            <span>Successful Captures</span>
                            <strong>
                                {results.results.filter(item => item.success).length}
                            </strong>
                        </div>
                        <div>
                            <span>Comparisons Completed</span>
                            <strong>
                                {results.results.filter(item => item.comparison).length}/2
                            </strong>
                        </div>
                    </div>

                    <div className="cross-browser-cards">
                        {results.results.map((item) => (
                            <article className="cross-browser-card" key={item.browser}>

                                <div className="cross-browser-card-heading">
                                    <h4>{browserNames[item.browser]}</h4>

                                    <span className={`result-badge ${item.success ? 'passed' : 'failed'
                                        }`}>
                                        {item.success ? 'CAPTURED' : 'FAILED'}
                                    </span>
                                </div>

                                {item.success ? (
                                    <>
                                        <a
                                            href={`${API_URL}${item.screenshot}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <img
                                                className="cross-browser-screenshot"
                                                src={`${API_URL}${item.screenshot}`}
                                                alt={`${browserNames[item.browser]} screenshot`}
                                            />
                                        </a>

                                        {item.comparison?.dimensionMismatch ? (
                                            <div className="cross-browser-error">
                                                <AlertTriangle size={15} />
                                                <div>
                                                    <strong>DIMENSION MISMATCH</strong>
                                                    <p>
                                                        Pixel comparison is unavailable because screenshot dimensions differ.
                                                    </p>
                                                    <p>
                                                        Chromium: {item.comparison.baselineDimensions.width} × {item.comparison.baselineDimensions.height}
                                                    </p>
                                                    <p>
                                                        WebKit: {item.comparison.currentDimensions.width} × {item.comparison.currentDimensions.height}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : item.comparison ? (
                                            <div className="cross-browser-metrics">
                                                <div>
                                                    <span>Similarity</span>
                                                    <strong>
                                                        {item.comparison.similarityPercentage != null
                                                            ? `${item.comparison.similarityPercentage}%`
                                                            : 'N/A'}
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>Difference</span>
                                                    <strong>
                                                        {item.comparison.differencePercentage != null
                                                            ? `${item.comparison.differencePercentage}%`
                                                            : 'N/A'}
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>Changed Pixels</span>
                                                    <strong>
                                                        {item.comparison.differentPixels?.toLocaleString() ?? 'N/A'}
                                                    </strong>
                                                </div>

                                                <span className={`result-badge ${item.comparison.passed ? 'passed' : 'failed'
                                                    }`}>
                                                    {item.comparison.passed
                                                        ? 'VISUAL TEST PASSED'
                                                        : 'VISUAL TEST FAILED'}
                                                </span>

                                                <div className="cross-browser-difference">
                                                    <h5>
                                                        <ImageIcon size={15} />
                                                        Difference Image
                                                    </h5>

                                                    <a
                                                        href={`${API_URL}${item.comparison.differenceImage}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <img
                                                            src={`${API_URL}${item.comparison.differenceImage}`}
                                                            alt={`${browserNames[item.browser]} visual differences`}
                                                        />
                                                    </a>
                                                </div>
                                            </div>
                                        ) : item.browser === 'chromium' ? (
                                            <p className="cross-browser-reference">
                                                <CheckCircle2 size={15} />
                                                Reference baseline
                                            </p>
                                        ) : (
                                            <div className="cross-browser-error">
                                                <AlertTriangle size={15} />
                                                <div>
                                                    <strong>Visual comparison unavailable</strong>
                                                    <p>
                                                        {item.comparisonError || 'Comparison could not be completed.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="cross-browser-error">
                                        {item.error || 'Screenshot capture failed'}
                                    </p>
                                )}

                            </article>
                        ))}
                    </div>

                    {/* DOM Layout Analysis */}
                    <div className="dom-analysis-section">
                        <div className="dom-analysis-heading">
                            <div>
                                <h3>DOM Layout Analysis</h3>
                                <p>
                                    Structural comparison of important elements
                                    and all visible HTML elements against Chromium.
                                </p>
                            </div>

                            <span className={`dom-status-badge ${overallDOMStatus.toLowerCase()}`}>
                                {overallDOMStatus}
                            </span>
                        </div>

                        {results.results
                            .filter(item => item.domComparison)
                            .map(item => (
                                <div className="dom-browser-result" key={item.browser}>
                                    <div className="dom-browser-heading">
                                        <h4>{browserNames[item.browser]} vs Chromium</h4>

                                        <span className={`dom-status-badge ${item.domComparison.status.toLowerCase()}`}>
                                            {item.domComparison.status}
                                        </span>
                                    </div>

                                    <div className="dom-analysis-grid">
                                        {[
                                            {
                                                title: 'Important Elements',
                                                data: item.domComparison.importantElements
                                            },
                                            {
                                                title: 'All Visible Elements',
                                                data: item.domComparison.allElements
                                            }
                                        ].map(section => (
                                            <div className="dom-analysis-card" key={section.title}>
                                                <h5>{section.title}</h5>

                                                <div className="dom-analysis-stats">
                                                    <div>
                                                        <span>Baseline Elements</span>
                                                        <strong>{section.data.total}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Differences</span>
                                                        <strong>{section.data.differenceCount}</strong>
                                                    </div>
                                                </div>

                                                {section.data.differences.length === 0 ? (
                                                    <p className="dom-no-differences">
                                                        No differences detected.
                                                    </p>
                                                ) : (
                                                    <div className="dom-differences-list">
                                                        {section.data.differences.map((difference, index) => (
                                                            <div className="dom-difference-item" key={`${difference.element}-${index}`}>
                                                                <strong title={difference.element}>
                                                                    {difference.element?.split('>').pop()?.split(':')[0] || 'element'}
                                                                    {`-${index}`}
                                                                    {' — '}
                                                                    {difference.type.toUpperCase()}
                                                                </strong>

                                                                {difference.changedProperties?.map(property => (
                                                                    <p key={property.property}>
                                                                        {property.property}: {property.chromium}
                                                                        {' → '}
                                                                        {property.comparedBrowser}
                                                                    </p>
                                                                ))}

                                                                {difference.message && (
                                                                    <p>{difference.message}</p>
                                                                )}

                                                                {difference.type === 'content' && (
                                                                    <p>
                                                                        Chromium: {difference.chromium}
                                                                        {' | '}
                                                                        {browserNames[item.browser]}: {difference.comparedBrowser}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>

                    <p className="cross-browser-note">
                        Chromium is used as the reference browser.
                        Firefox and WebKit are compared against its screenshot.
                    </p>

                </div>
            )}
            <CrossBrowserHistory />
        </section>
    )
}

export default CrossBrowser
