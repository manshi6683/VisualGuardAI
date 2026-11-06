
import { useEffect, useState } from 'react'
import {
    FileBarChart,
    CheckCircle2,
    AlertTriangle,
    ScanSearch,
    Activity,
    Clock3,
    LoaderCircle,
    RefreshCw,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const API_URL = 'http://localhost:5000/api'

function Reports() {
    const [stats, setStats] = useState(null)
    const [analytics, setAnalytics] = useState(null)
    const [history, setHistory] = useState([])
    const [dateFilter, setDateFilter] = useState('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [selectedScan, setSelectedScan] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [previewImage, setPreviewImage] = useState(null)
    const [zoom, setZoom] = useState(1)
    const exportExcel = () => {
        const headers = [
            'Scan ID',
            'Website',
            'Date',
            'Difference (%)',
            'Status',
        ]

        const rows = filteredHistory.map((scan) => [
            scan.id,
            scan.title || scan.url,
            scan.created_at
                ? new Date(scan.created_at).toLocaleString()
                : 'N/A',
            scan.difference_percentage != null
                ? Number(scan.difference_percentage).toFixed(2)
                : 'Not compared',
            scan.status,
        ])

        const csvContent = [headers, ...rows]
            .map((row) =>
                row.map((value) =>
                    `"${String(value ?? '').replace(/"/g, '""')}"`
                ).join(',')
            )
            .join('\n')

        const blob = new Blob(['\uFEFF' + csvContent], {
            type: 'text/csv;charset=utf-8;',
        })

        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.href = url
        link.download = 'VisualGuard_Test_Reports.csv'
        link.click()

        URL.revokeObjectURL(url)
    }
    const exportPDF = () => {
        const doc = new jsPDF()

        doc.setFontSize(20)
        doc.text('VisualGuard AI - Test Report', 14, 20)

        doc.setFontSize(11)
        doc.text(`Total Scans: ${stats?.totalScans ?? 0}`, 14, 32)
        doc.text(`Tests Passed: ${stats?.passedScans ?? 0}`, 14, 40)
        doc.text(`Visual Issues: ${stats?.visualIssues ?? 0}`, 14, 48)
        doc.text(`Pass Rate: ${stats?.passRate ?? 0}%`, 14, 56)

        autoTable(doc, {
            startY: 66,
            head: [[
                'Scan ID',
                'Website',
                'Date',
                'Difference',
                'Status',
            ]],
            body: filteredHistory.map((scan) => [
                scan.id,
                scan.title || scan.url || 'N/A',
                scan.created_at
                    ? new Date(scan.created_at).toLocaleString()
                    : 'N/A',
                scan.difference_percentage != null
                    ? `${Number(scan.difference_percentage).toFixed(2)}%`
                    : 'Not compared',
                scan.status || 'Pending',
            ]),
            styles: {
                fontSize: 8,
                cellPadding: 3,
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: [8, 145, 178],
            },
        })

        doc.save('VisualGuard_Test_Report.pdf')
    }
    const loadScanDetails = async (scanId) => {
        setDetailLoading(true)
        setDetailError('')
        setSelectedScan(null)

        try {
            const response = await fetch(`${API_URL}/history/${scanId}`)
            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error('Unable to load scan details.')
            }

            setSelectedScan(result.data)
        } catch (err) {
            setDetailError(err.message || 'Something went wrong.')
        } finally {
            setDetailLoading(false)
        }
    }
    const loadReports = async () => {
        setLoading(true)
        setError('')

        try {
            const [statsResponse, analyticsResponse, historyResponse] =
                await Promise.all([
                    fetch(`${API_URL}/stats`),
                    fetch(`${API_URL}/analytics`),
                    fetch(`${API_URL}/history`),
                ])

            const [statsResult, analyticsResult, historyResult] =
                await Promise.all([
                    statsResponse.json(),
                    analyticsResponse.json(),
                    historyResponse.json(),
                ])

            if (
                !statsResponse.ok || !statsResult.success ||
                !analyticsResponse.ok || !analyticsResult.success ||
                !historyResponse.ok || !historyResult.success
            ) {
                throw new Error('Unable to load report data.')
            }

            setStats(statsResult.data)
            setAnalytics(analyticsResult.data)
            setHistory(historyResult.data)
        } catch (err) {
            setError(err.message || 'Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadReports()
    }, [])
    useEffect(() => {
        const isModalOpen = Boolean(
            selectedScan || detailLoading || detailError
        );

        if (!isModalOpen) return;

        const scrollY = window.scrollY;
        const html = document.documentElement;
        const body = document.body;

        const previousHtmlOverflow = html.style.overflow;
        const previousBodyOverflow = body.style.overflow;
        const previousBodyPosition = body.style.position;
        const previousBodyTop = body.style.top;

        html.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;

        return () => {
            html.style.overflow = previousHtmlOverflow;
            body.style.overflow = previousBodyOverflow;
            body.style.position = previousBodyPosition;
            body.style.top = previousBodyTop;

            window.scrollTo(0, scrollY);
        };
    }, [selectedScan, detailLoading, detailError]);

    useEffect(() => {
        const isModalOpen = Boolean(
            selectedScan || detailLoading || detailError
        );

        if (!isModalOpen) return;

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setSelectedScan(null);
                setDetailError('');
                setDetailLoading(false);
                setPreviewImage(null);
                setZoom(1);
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [selectedScan, detailLoading, detailError]);
    useEffect(() => {
        const isModalOpen = Boolean(
            selectedScan || detailLoading || detailError
        );

        if (!isModalOpen) return;

        const modal = document.querySelector('.scan-details-modal');

        if (!modal) return;

        const getFocusableElements = () => {
            return Array.from(
                modal.querySelectorAll(
                    'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
                )
            ).filter((element) => element.offsetParent !== null);
        };

        const focusFirstElement = () => {
            const elements = getFocusableElements();
            elements[0]?.focus();
        };

        const handleTab = (event) => {
            if (event.key !== 'Tab') return;

            const elements = getFocusableElements();

            if (!elements.length) {
                event.preventDefault();
                modal.focus();
                return;
            }

            const first = elements[0];
            const last = elements[elements.length - 1];

            if (event.shiftKey) {
                if (
                    document.activeElement === first ||
                    !modal.contains(document.activeElement)
                ) {
                    event.preventDefault();
                    last.focus();
                }
            } else {
                if (
                    document.activeElement === last ||
                    !modal.contains(document.activeElement)
                ) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };

        focusFirstElement();

        document.addEventListener('keydown', handleTab, true);

        return () => {
            document.removeEventListener('keydown', handleTab, true);
        };
    }, [selectedScan, detailLoading, detailError]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64 gap-3 text-cyan-400">
                <LoaderCircle className="animate-spin" size={22} />
                Loading test reports...
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
                <p>{error}</p>
                <button
                    onClick={loadReports}
                    className="mt-4 flex items-center gap-2 text-sm text-cyan-400"
                >
                    <RefreshCw size={15} /> Try Again
                </button>
            </div>
        )
    }

    const reportCards = [
        {
            label: 'TOTAL SCANS',
            value: stats?.totalScans ?? 0,
            icon: ScanSearch,
            color: 'text-cyan-400',
        },
        {
            label: 'TESTS PASSED',
            value: stats?.passedScans ?? 0,
            icon: CheckCircle2,
            color: 'text-emerald-400',
        },
        {
            label: 'VISUAL ISSUES',
            value: stats?.visualIssues ?? 0,
            icon: AlertTriangle,
            color: 'text-red-400',
        },
        {
            label: 'PASS RATE',
            value: `${stats?.passRate ?? 0}%`,
            icon: Activity,
            color: 'text-violet-400',
        },
    ]

    const distribution = analytics?.distribution ?? {
        passed: 0,
        failed: 0,
        pending: 0,
    }

    const total = distribution.passed +
        distribution.failed +
        distribution.pending
    const filteredHistory = history.filter((scan) => {
        if (dateFilter === 'all') return true
        if (!scan.created_at) return false

        const scanDate = new Date(scan.created_at)
        const now = new Date()

        if (dateFilter === 'today') {
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)

            const todayEnd = new Date()
            todayEnd.setHours(23, 59, 59, 999)

            return scanDate >= todayStart && scanDate <= todayEnd
        }

        if (dateFilter === '7days' || dateFilter === '30days') {
            const days = dateFilter === '7days' ? 7 : 30
            const start = new Date()
            start.setHours(0, 0, 0, 0)
            start.setDate(now.getDate() - (days - 1))

            return scanDate >= start && scanDate <= now
        }

        if (dateFilter === 'custom') {
            if (startDate) {
                const start = new Date(`${startDate}T00:00:00`)
                if (scanDate < start) return false
            }

            if (endDate) {
                const end = new Date(`${endDate}T23:59:59.999`)
                if (scanDate > end) return false
            }
        }

        return true
    })

    return (
        <div className="space-y-7 pb-8">

            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                        <FileBarChart size={22} />
                        <span className="text-xs font-semibold tracking-widest">
                            QUALITY REPORT CENTER
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">
                        Testing Reports
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Review your visual testing performance and execution history.
                    </p>
                </div>

                <button
                    onClick={exportExcel}
                    disabled={history.length === 0}
                    className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <FileBarChart size={16} />
                    Export Excel
                </button>
                <button
                    onClick={exportPDF}
                    disabled={history.length === 0}
                    className="flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <FileBarChart size={16} />
                    Export PDF
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {reportCards.map((card) => {
                    const Icon = card.icon

                    return (
                        <div
                            key={card.label}
                            className="rounded-xl border border-slate-700 bg-slate-900/70 p-5"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs tracking-wider text-slate-400">
                                    {card.label}
                                </span>
                                <Icon className={card.color} size={20} />
                            </div>

                            <p className={`text-3xl font-bold ${card.color}`}>
                                {card.value}
                            </p>
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
                    <h3 className="text-lg font-semibold text-white mb-5">
                        Test Distribution
                    </h3>

                    <div className="space-y-5">
                        {[
                            { label: 'Passed', value: distribution.passed, color: 'bg-emerald-400' },
                            { label: 'Failed', value: distribution.failed, color: 'bg-red-400' },
                            { label: 'Pending', value: distribution.pending, color: 'bg-amber-400' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-300">{item.label}</span>
                                    <span className="text-white font-semibold">
                                        {item.value}
                                        {' '}({total ? Math.round(item.value / total * 100) : 0}%)
                                    </span>
                                </div>

                                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.color}`}
                                        style={{
                                            width: `${total ? item.value / total * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
                    <h3 className="text-lg font-semibold text-white mb-5">
                        Report Summary
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                            <span className="text-sm text-slate-400">Total Executions</span>
                            <strong className="text-white">{stats?.totalScans ?? 0}</strong>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                            <span className="text-sm text-slate-400">Successful Tests</span>
                            <strong className="text-emerald-400">
                                {stats?.passedScans ?? 0}
                            </strong>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                            <span className="text-sm text-slate-400">Failed Tests</span>
                            <strong className="text-red-400">
                                {stats?.failedScans ?? 0}
                            </strong>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Visual Issues</span>
                            <strong className="text-violet-400">
                                {stats?.visualIssues ?? 0}
                            </strong>
                        </div>
                    </div>
                </section>
            </div>
            {/* Date Filters */}
            <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
                <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-sm font-semibold text-white">
                        Filter Reports:
                    </label>

                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-cyan-400"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {dateFilter === 'custom' && (
                        <>
                            <input
                                type="date"
                                value={startDate}
                                max={endDate || undefined}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />

                            <input
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                            />
                        </>
                    )}

                    <button
                        onClick={() => {
                            setDateFilter('all')
                            setStartDate('')
                            setEndDate('')
                        }}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-400"
                    >
                        Reset Filter
                    </button>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                    Showing {filteredHistory.length} of {history.length} reports
                </p>
            </section>
            {/* Full Screen Image Preview */}
            {previewImage && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4">
                    <div className="w-full h-full flex flex-col">

                        <div className="flex items-center justify-between flex-wrap gap-3 p-3">
                            <h3 className="text-lg font-semibold text-white">
                                {previewImage.label}
                            </h3>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setZoom((prev) => Math.min(prev + 0.25, 3))}
                                    className="rounded-lg border border-slate-600 px-3 py-2 text-white hover:bg-slate-800"
                                >
                                    + Zoom
                                </button>

                                <button
                                    onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.5))}
                                    className="rounded-lg border border-slate-600 px-3 py-2 text-white hover:bg-slate-800"
                                >
                                    − Zoom
                                </button>

                                <button
                                    onClick={() => setZoom(1)}
                                    className="rounded-lg border border-slate-600 px-3 py-2 text-white hover:bg-slate-800"
                                >
                                    Reset
                                </button>

                                <button
                                    onClick={() => {
                                        setPreviewImage(null)
                                        setZoom(1)
                                    }}
                                    className="rounded-lg border border-slate-600 px-4 py-2 text-white hover:bg-slate-800"
                                >
                                    ✕ Close
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center overflow-auto">
                            <img
                                src={previewImage.src}
                                alt={previewImage.label}
                                style={{
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'center center',
                                    transition: 'transform 0.2s ease',
                                }}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                    </div>
                </div>
            )}
            {/* Scan Details Modal */}
            {(selectedScan || detailLoading || detailError) && (
                <div
                    className="scan-details-modal fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="scan-details-title"
                >
                    <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2
                                    id="scan-details-title"
                                    className="text-xl font-bold text-white"
                                >
                                    Scan Details
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    Detailed visual testing report
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedScan(null)
                                    setDetailError('')
                                }}
                                className="rounded-lg border border-slate-700 px-3 py-2 text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {detailLoading && (
                            <div className="flex items-center justify-center gap-3 py-12 text-cyan-400">
                                <LoaderCircle className="animate-spin" size={22} />
                                Loading scan details...
                            </div>
                        )}

                        {detailError && (
                            <p className="rounded-lg bg-red-500/10 p-4 text-red-400">
                                {detailError}
                            </p>
                        )}

                        {selectedScan && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-slate-900 p-4">
                                        <p className="text-xs text-slate-400">SCAN ID</p>
                                        <p className="text-lg font-bold text-cyan-400">
                                            #{selectedScan.id}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-900 p-4">
                                        <p className="text-xs text-slate-400">STATUS</p>
                                        <p className="text-lg font-bold text-white">
                                            {selectedScan.status || 'Pending'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-900 p-4">
                                        <p className="text-xs text-slate-400">SIMILARITY</p>
                                        <p className="text-lg font-bold text-emerald-400">
                                            {selectedScan.similarity_percentage ?? 'N/A'}
                                            {selectedScan.similarity_percentage != null ? '%' : ''}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-900 p-4">
                                        <p className="text-xs text-slate-400">DIFFERENCE</p>
                                        <p className="text-lg font-bold text-red-400">
                                            {selectedScan.difference_percentage != null
                                                ? `${Number(selectedScan.difference_percentage).toFixed(2)}%`
                                                : 'Not compared'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-900 p-4">
                                        <p className="text-xs text-slate-400">CHANGED PIXELS</p>
                                        <p className="text-lg font-bold text-white">
                                            {selectedScan.changed_pixels ?? 'N/A'}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-900 p-4">
                                        <p className="text-xs text-slate-400">VIEWPORT</p>
                                        <p className="text-lg font-bold text-white">
                                            {selectedScan.viewport || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-900 p-4 space-y-3">
                                    <p className="text-xs text-slate-400">WEBSITE</p>
                                    {/* Screenshot Previews */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-white">
                                            Screenshot Comparison
                                        </h3>

                                        {[
                                            {
                                                label: 'Baseline Screenshot',
                                                src: selectedScan.baseline_filename
                                                    ? `http://localhost:5000/baselines/${encodeURIComponent(selectedScan.baseline_filename)}`
                                                    : null,
                                            },
                                            {
                                                label: 'Current Screenshot',
                                                src: selectedScan.screenshot
                                                    ? `http://localhost:5000${selectedScan.screenshot}`
                                                    : null,
                                            },
                                            {
                                                label: 'Difference Screenshot',
                                                src: selectedScan.difference_image
                                                    ? `http://localhost:5000${selectedScan.difference_image}`
                                                    : null,
                                            },
                                        ].map((image) => (
                                            <div
                                                key={image.label}
                                                className="rounded-xl border border-slate-700 bg-slate-900 p-4"
                                            >
                                                <p className="text-sm font-semibold text-slate-300 mb-3">
                                                    {image.label}
                                                </p>

                                                {image.src ? (
                                                    <img
                                                        src={image.src}
                                                        alt={image.label}
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-label={`Open ${image.label} preview`}
                                                        onClick={() => setPreviewImage({
                                                            src: image.src,
                                                            label: image.label,
                                                        })}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter' || event.key === ' ') {
                                                                event.preventDefault();

                                                                setPreviewImage({
                                                                    src: image.src,
                                                                    label: image.label,
                                                                });
                                                            }
                                                        }}
                                                        className="w-full max-h-72 object-contain rounded-lg bg-slate-950 cursor-zoom-in hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-slate-500">
                                                        Screenshot not available.
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="break-all text-sm text-cyan-400">
                                        {selectedScan.url || 'N/A'}
                                    </p>

                                    <p className="text-xs text-slate-400 pt-2">PAGE TITLE</p>
                                    <p className="text-sm text-white">
                                        {selectedScan.title || 'N/A'}
                                    </p>

                                    <p className="text-xs text-slate-400 pt-2">CREATED AT</p>
                                    <p className="text-sm text-white">
                                        {selectedScan.created_at
                                            ? new Date(selectedScan.created_at).toLocaleString()
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <section className="rounded-xl border border-slate-700 bg-slate-900/70 overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-5 border-b border-slate-700">
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            Recent Test Reports
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Latest executions from your testing database
                        </p>
                    </div>
                    <Clock3 className="text-cyan-400" size={20} />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-sm text-left">
                        <thead className="bg-slate-950/70 text-slate-400 text-xs">
                            <tr>
                                <th className="p-4">SCAN ID</th>
                                <th className="p-4">WEBSITE</th>
                                <th className="p-4">DATE</th>
                                <th className="p-4">DIFFERENCE</th>
                                <th className="p-4">STATUS</th>
                                <th className="p-4">ACTION</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredHistory.map((scan) => (
                                <tr key={scan.id} className="border-t border-slate-800">
                                    <td className="p-4 text-cyan-400">#{scan.id}</td>
                                    <td className="p-4 text-white">{scan.title || scan.url}</td>
                                    <td className="p-4 text-slate-400">
                                        {scan.created_at
                                            ? new Date(scan.created_at).toLocaleString()
                                            : 'N/A'}
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        {scan.difference_percentage != null
                                            ? `${Number(scan.difference_percentage).toFixed(2)}%`
                                            : 'Not compared'}
                                    </td>
                                    <td className="p-4">
                                        <span className={
                                            scan.status === 'Passed'
                                                ? 'text-emerald-400'
                                                : scan.status === 'Failed'
                                                    ? 'text-red-400'
                                                    : 'text-amber-400'
                                        }>
                                            {scan.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => loadScanDetails(scan.id)}
                                            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">
                                        No reports found for this date range.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

export default Reports
