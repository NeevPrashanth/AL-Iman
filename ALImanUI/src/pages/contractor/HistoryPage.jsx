import React, { useEffect, useState } from 'react';
import { fetchTimesheetsForContractor } from '../../api';

export default function HistoryPage({ session }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTimesheetsForContractor(session.userId, session.token);
        setHistory(data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load history.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session.userId, session.token]);

  if (loading) return <div className="page-card">Loading history...</div>;

  return (
    <div className="page-card">
      <h3>Approved / Download</h3>
      {error && <div className="banner">{error}</div>}
      <table>
        <thead><tr><th>Month</th><th>Status</th><th>Hours</th><th>Download</th></tr></thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id || h.month}>
              <td>{h.release?.monthYear}</td>
              <td><span className={`badge ${(h.status || '').toLowerCase()}`}>{h.status}</span></td>
              <td>{(h.entries || []).reduce((sum, e) => sum + Number(e.hoursWorked || 0), 0)}</td>
              <td>
                <button className="btn secondary" disabled={!h.downloadUrl} onClick={() => h.downloadUrl && window.open(h.downloadUrl, '_blank')}>
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12, color: '#7a1a1a', fontWeight: 600 }}>Reminder: rejected months show as banner on login.</div>
    </div>
  );
}
