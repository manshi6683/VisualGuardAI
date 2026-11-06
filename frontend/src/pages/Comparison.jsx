
import { useEffect, useState } from 'react'
import { getScanHistory } from '../services/api'
import {
    GitCompareArrows,
    CheckCircle2,
    AlertTriangle,
    Image as ImageIcon,
    LoaderCircle,
} from 'lucide-react'

const SERVER_URL = 'http://localhost:5000'

function Comparison() {
    const [scans, setScans] = useState([])
    const [selectedId, setSelectedId] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const loadComparisons = async () => {
            try {
                const history = await getScanHistory()

                const completed = history.filter(
                    (scan) => scan.baseline_filename && scan.difference_image
                )

                setScans(completed)

                if (completed.length > 0) {
                    setSelectedId(String(completed[0].id))
                }
            } catch (err) {
                setError(err.message || 'Unable to load comparisons')
            } finally {
                setLoading(false)
            }
        }

        loadComparisons()
    }, [])

    const selectedScan = scans.find(
        (scan) => String(scan.id) === selectedId
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64 text-cyan-400 gap-3">
                <LoaderCircle className="animate-spin" size={22} />
                Loading comparisons...
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300">
                {error}
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <GitCompareArrows className="text-cyan-400" size={26} />
                    <h1 className="text-2xl font-bold text-white">
                        Visual Comparison
                    </h1>
                </div>
                <p className="text-sm text-slate-400">
                    Compare baseline screenshots with current captures and identify visual changes.
                </p>
            </div>

            {scans.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-10 text-center">
                    <ImageIcon className="mx-auto mb-4 text-slate-500" size={40} />
                    <h2 className="text-lg font-semibold text-white">
                        No comparisons available
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Save a baseline and run a comparison to see results here.
                    </p>
                </div>
            ) : (
                <>
                    <div className="rounded-xl border border-slate-700/80 bg-gradient-to-br from-slate-900 to-slate-950 p-5 min-h-[110px] flex flex-col justify-center hover:border-cyan-500/40 transition-colors">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Select Comparison
                        </label>

                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full md:max-w-lg rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition-all focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        >
                            {scans.map((scan) => (
                                <option key={scan.id} value={scan.id}>
                                    Scan #{scan.id} — {scan.title} — {scan.status}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedScan && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard
                                    label="Similarity"
                                    value={`${Number(selectedScan.similarity_percentage).toFixed(2)}%`}
                                />
                                <MetricCard
                                    label="Difference"
                                    value={`${Number(selectedScan.difference_percentage).toFixed(2)}%`}
                                />
                                <MetricCard
                                    label="Changed Pixels"
                                    value={Number(selectedScan.changed_pixels).toLocaleString()}
                                />
                                <MetricCard
                                    label="Test Status"
                                    value={selectedScan.status}
                                    status={selectedScan.status}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                <ScreenshotCard
                                    title="Baseline Screenshot"
                                    subtitle="Original reference image"
                                    src={`${SERVER_URL}/baselines/${encodeURIComponent(selectedScan.baseline_filename)}`}
                                />

                                <ScreenshotCard
                                    title="Current Screenshot"
                                    subtitle="Latest captured image"
                                    src={`${SERVER_URL}${selectedScan.screenshot}`}
                                />

                                <div className="lg:col-span-2 mt-2">
                                    <ScreenshotCard
                                        title="Difference Image"
                                        subtitle="Highlighted visual differences"
                                        src={`${SERVER_URL}${selectedScan.difference_image}`}
                                        difference
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            Visual Analysis
                                        </h3>
                                        <p className="text-sm text-slate-400 mt-1">
                                            Automated pixel comparison summary
                                        </p>
                                    </div>

                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${Number(selectedScan.difference_percentage) <= 0.5
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                        }`}>
                                        {Number(selectedScan.difference_percentage) <= 0.5
                                            ? 'No Significant Changes'
                                            : 'Visual Changes Detected'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-lg bg-slate-950/70 border border-slate-700 p-4">
                                        <p className="text-xs text-slate-400 mb-2">
                                            Comparison Result
                                        </p>
                                        <p className="text-xl font-bold text-white">
                                            {Number(selectedScan.difference_percentage) <= 0.5
                                                ? 'Passed'
                                                : 'Failed'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Acceptance threshold: 0.5%
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-slate-950/70 border border-slate-700 p-4">
                                        <p className="text-xs text-slate-400 mb-2">
                                            Visual Difference
                                        </p>
                                        <p className="text-xl font-bold text-white">
                                            {Number(selectedScan.difference_percentage).toFixed(2)}%
                                        </p>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {Number(selectedScan.changed_pixels).toLocaleString()} pixels changed
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-slate-700 p-4">
                                    <h4 className="text-sm font-semibold text-white mb-2">
                                        Analysis Summary
                                    </h4>

                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {Number(selectedScan.difference_percentage) <= 0.5
                                            ? 'The current screenshot matches the baseline within the accepted 0.5% difference threshold. No significant visual regression was detected.'
                                            : `The current screenshot differs from the baseline by ${Number(selectedScan.difference_percentage).toFixed(2)}%. ${Number(selectedScan.changed_pixels).toLocaleString()} pixels have changed. The difference exceeds the accepted 0.5% threshold and requires review.`}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
                                <h3 className="font-semibold text-white mb-3">
                                    Scan Information
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <Info label="Website URL" value={selectedScan.url} />
                                    <Info label="Page Title" value={selectedScan.title} />
                                    <Info label="Viewport" value={selectedScan.viewport} />
                                    <Info
                                        label="Dimensions"
                                        value={`${selectedScan.width} × ${selectedScan.height}`}
                                    />
                                    <Info label="Scan ID" value={`#${selectedScan.id}`} />
                                    <Info label="Created At" value={selectedScan.created_at} />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}

function MetricCard({ label, value, status }) {
    const passed = status === 'Passed'
    const failed = status === 'Failed'

    return (
        <div className="rounded-xl border border-slate-700/80 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-4">
            <p className="text-sm text-slate-400 mb-2">{label}</p>
            <div className="flex items-center gap-2">
                {passed && <CheckCircle2 className="text-emerald-400" size={19} />}
                {failed && <AlertTriangle className="text-red-400" size={19} />}
                <span className="text-xl font-bold text-white">{value}</span>
            </div>
        </div>
    )
}

function ScreenshotCard({ title, subtitle, src, difference = false }) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/80 shadow-lg shadow-black/10">
            <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            </div>

            <div className="bg-slate-950 p-4 flex items-center justify-center min-h-[260px]">
                <img
                    src={src}
                    alt={title}
                    className={`w-full h-auto max-h-[420px] object-contain rounded-lg ${difference ? 'border border-red-500/30' : ''
                        }`}
                    onError={(e) => {
                        e.currentTarget.alt = 'Image could not be loaded'
                    }}
                />
            </div>
        </div>
    )
}

function Info({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-slate-500 mb-1">{label}</p>
            <p className="text-slate-200 break-words">{value || 'N/A'}</p>
        </div>
    )
}

export default Comparison
