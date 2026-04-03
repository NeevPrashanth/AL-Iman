import React, { useEffect, useState } from 'react';
import { downloadApprovedTimesheetPdf, fetchApprovedTimesheetDownloads } from '../../api';

export default function HistoryPage({ session }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchApprovedTimesheetDownloads(session.token);
        setHistory(data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load history.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session.token]);

  const handleDownload = async (timesheetId) => {
    try {
      setDownloadingId(timesheetId);
      const response = await downloadApprovedTimesheetPdf(timesheetId, session.token);
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `approved-timesheet-${timesheetId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <div className="page-card">Loading history...</div>;

  return (
    <div className="page-card">
      <h3>Aprroved History</h3>
      {error && <div className="banner">{error}</div>}
      <table>
        <thead><tr><th>Month</th><th>Status</th><th>Hours</th><th>Download</th></tr></thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.timesheetId}>
              <td>{h.monthYear}</td>
              <td><span className={`badge ${(h.status || '').toLowerCase()}`}>{h.status}</span></td>
              <td>{Number(h.totalHours || 0)}</td>
              <td>
                <button
                  className="btn secondary"
                  disabled={downloadingId === h.timesheetId}
                  onClick={() => handleDownload(h.timesheetId)}
                >
                  {downloadingId === h.timesheetId ? '...' : 'PDF'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
