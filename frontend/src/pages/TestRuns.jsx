
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getScanHistory,
  getScanDetails,
  deleteScan
} from '../services/api'

import {
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  X,
  Eye,
  Image as ImageIcon
} from 'lucide-react'

const IMAGE_BASE_URL = 'http://localhost:5000'

function TestRuns() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedScan, setSelectedScan] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getScanHistory()
      setScans(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const isModalOpen = detailsLoading || Boolean(selectedScan);

    console.error("MODAL STATE:", isModalOpen);

    if (!isModalOpen) return;

    const scrollY = window.scrollY;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    console.error("BODY POSITION:", document.body.style.position);
    console.error("BODY TOP:", document.body.style.top);

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';

      window.scrollTo(0, scrollY);
    };
  }, [detailsLoading, selectedScan]);

  useEffect(() => {
    loadHistory()
  }, [])

  const openDetails = async (id) => {
    try {
      setDetailsLoading(true)
      setSelectedScan(null)

      const data = await getScanDetails(id)
      setSelectedScan(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this scan record?'
    )

    if (!confirmed) return

    try {
      await deleteScan(id)
      setScans(previous => previous.filter(scan => scan.id !== id))

      if (selectedScan?.id === id) {
        setSelectedScan(null)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const getStatusIcon = (status) => {
    if (status === 'Passed') return <CheckCircle2 size={15} />
    if (status === 'Failed') return <AlertTriangle size={15} />
    return <Clock3 size={15} />
  }

  const getViewportIcon = (viewport) => {
    if (viewport === 'Mobile') return <Smartphone size={15} />
    if (viewport === 'Tablet') return <Tablet size={15} />
    return <Monitor size={15} />
  }

  const imageUrl = (imagePath) =>
    imagePath ? `${IMAGE_BASE_URL}${imagePath}` : null

  return (
    <section className="real-history">

      <div className="real-history-header">
        <div>
          <span className="section-kicker">DATABASE RECORDS</span>
          <h2>Visual Scan History</h2>
          <p>All your website scans stored in the SQLite database.</p>
        </div>

        <button
          className="history-refresh"
          onClick={loadHistory}
          disabled={loading}
        >
          <RefreshCw size={16} />
          REFRESH
        </button>
      </div>

      <div className="history-summary">
        <div className="history-summary-card">
          <span>TOTAL SCANS</span>
          <strong>{scans.length}</strong>
        </div>

        <div className="history-summary-card">
          <span>PASSED</span>
          <strong>
            {scans.filter(scan => scan.status === 'Passed').length}
          </strong>
        </div>

        <div className="history-summary-card">
          <span>FAILED</span>
          <strong>
            {scans.filter(scan => scan.status === 'Failed').length}
          </strong>
        </div>
      </div>

      {error && <div className="history-error">{error}</div>}

      {loading ? (
        <div className="history-empty">Loading scan history...</div>
      ) : scans.length === 0 ? (
        <div className="history-empty">No scan records found.</div>
      ) : (
        <div className="history-table-wrapper">
          <table className="real-history-table">
            <thead>
              <tr>
                <th>WEBSITE</th>
                <th>BROWSER</th>
                <th>VIEWPORT</th>
                <th>SIMILARITY</th>
                <th>DIFFERENCE</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {scans.map(scan => (
                <tr key={scan.id}>
                  <td>
                    <div className="history-website">
                      <Globe size={17} />
                      <div>
                        <strong>{scan.title || 'Untitled Website'}</strong>
                        <small>{scan.url}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="history-viewport">
                      <Globe size={15} />
                      {scan.browser || 'Chromium'}
                    </span>
                  </td>
                  <td>
                    <span className="history-viewport">
                      {getViewportIcon(scan.viewport)}
                      {scan.viewport}
                    </span>
                  </td>

                  <td>
                    {scan.similarity_percentage == null
                      ? '—'
                      : `${scan.similarity_percentage}%`}
                  </td>

                  <td>
                    {scan.difference_percentage == null
                      ? '—'
                      : `${scan.difference_percentage}%`}
                  </td>

                  <td>
                    <span className={`history-status ${scan.status.toLowerCase()}`}>
                      {getStatusIcon(scan.status)}
                      {scan.status}
                    </span>
                  </td>

                  <td>
                    {new Date(
                      scan.created_at.replace(' ', 'T') + 'Z'
                    ).toLocaleString()}
                  </td>

                  <td>
                    <div className="history-actions">
                      <button
                        onClick={() => openDetails(scan.id)}
                        title="View scan details"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(scan.id)}
                        title="Delete scan record"
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
      )}

      {/* SCAN DETAILS MODAL */}
      {(detailsLoading || selectedScan) && createPortal(
        <div
          className="scan-modal-overlay"
          onClick={() => {
            setSelectedScan(null)
            setDetailsLoading(false)
          }}
        >
          <div
            className="scan-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="scan-modal-header">
              <div>
                <span className="section-kicker">SCAN REPORT</span>
                <h2>Visual Scan Details</h2>
              </div>

              <button
                className="scan-modal-close"
                onClick={() => {
                  setSelectedScan(null)
                  setDetailsLoading(false)
                }}
              >
                <X size={20} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="history-empty">
                Loading scan details...
              </div>
            ) : selectedScan && (
              <div className="scan-modal-content">

                <div className="scan-detail-info">
                  <div>
                    <span>WEBSITE</span>
                    <strong>{selectedScan.title || 'Untitled Website'}</strong>
                    <small>{selectedScan.url}</small>
                  </div>
                  <div>
                    <span>BROWSER</span>
                    <strong>{selectedScan.browser || 'Chromium'}</strong>
                  </div>
                  <div>
                    <span>VIEWPORT</span>
                    <strong>
                      {selectedScan.viewport} · {selectedScan.width} × {selectedScan.height}
                    </strong>
                  </div>

                  <div>
                    <span>STATUS</span>
                    <strong className={selectedScan.status === 'Passed' ? 'detail-passed' : selectedScan.status === 'Failed' ? 'detail-failed' : ''}>
                      {selectedScan.status}
                    </strong>
                  </div>

                  <div>
                    <span>EXECUTION DATE</span>
                    <strong>
                      {new Date(
                        selectedScan.created_at.replace(' ', 'T') + 'Z'
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="scan-detail-metrics">
                  <div>
                    <span>SIMILARITY</span>
                    <strong>
                      {selectedScan.similarity_percentage == null
                        ? '—'
                        : `${selectedScan.similarity_percentage}%`}
                    </strong>
                  </div>

                  <div>
                    <span>DIFFERENCE</span>
                    <strong>
                      {selectedScan.difference_percentage == null
                        ? '—'
                        : `${selectedScan.difference_percentage}%`}
                    </strong>
                  </div>

                  <div>
                    <span>CHANGED PIXELS</span>
                    <strong>
                      {selectedScan.changed_pixels == null
                        ? '—'
                        : selectedScan.changed_pixels.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="scan-detail-image">
                  <h3>
                    <ImageIcon size={17} />
                    Captured Screenshot
                  </h3>

                  {selectedScan.screenshot ? (
                    <a
                      href={imageUrl(selectedScan.screenshot)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={imageUrl(selectedScan.screenshot)}
                        alt="Captured website screenshot"
                      />
                    </a>
                  ) : (
                    <p>No screenshot available.</p>
                  )}
                </div>

                <div className="scan-detail-image">
                  <h3>
                    <ImageIcon size={17} />
                    Difference Image
                  </h3>

                  {selectedScan.difference_image ? (
                    <a
                      href={imageUrl(selectedScan.difference_image)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={imageUrl(selectedScan.difference_image)}
                        alt="Visual difference screenshot"
                      />
                    </a>
                  ) : (
                    <p>No comparison has been performed for this scan.</p>
                  )}
                </div>

                <div className="scan-modal-footer">
                  <span>SCAN ID: #{selectedScan.id}</span>
                  <span>VISUALGUARD AI</span>
                </div>

              </div>
            )}
          </div>
        </div>
        , document.body
      )}

    </section>
  )
}

export default TestRuns
