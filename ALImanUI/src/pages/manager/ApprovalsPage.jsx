import React, { useEffect, useMemo, useState } from 'react';
import { decidePendingTimesheet, fetchPendingApprovals } from '../../api';

function formatMonth(monthYear) {
  if (!monthYear) return '-';
  const [year, month] = monthYear.split('-').map(Number);
  if (!year || !month) return monthYear;
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export default function ApprovalsPage({ session }) {
  const [timesheets, setTimesheets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const data = await fetchPendingApprovals(session.token);
    setTimesheets(data || []);
  };

  useEffect(() => {
    load();
  }, [session.token]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return timesheets;
    return timesheets.filter((ts) => {
      const contractor = ts.contractor?.fullName || '';
      const month = ts.release?.monthYear || '';
      const status = ts.status || '';
      return [contractor, month, status].some((value) => String(value).toLowerCase().includes(q));
    });
  }, [timesheets, searchTerm]);

  const selected = useMemo(
    () => filtered.find((ts) => ts.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  useEffect(() => {
    if (!selected && filtered.length > 0) setSelectedId(filtered[0].id);
  }, [filtered, selected]);

  const totalHours = useMemo(
    () => (selected?.entries || []).reduce((sum, e) => sum + Number(e.hoursWorked || 0), 0),
    [selected]
  );

  const decide = async (approve) => {
    if (!selected) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await decidePendingTimesheet(
        {
          timesheetId: selected.id,
          approve,
          rejectionReason: approve ? null : rejectionReason,
        },
        session.token
      );
      setMessage(approve ? 'Timesheet approved.' : 'Timesheet rejected.');
      setRejectionReason('');
      await load();
      setSelectedId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete decision.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-card approvals-page">
      <div className="topbar">
        <h3>Timesheet Approval</h3>
      </div>
      <div className="toolbar">
        <div />
        <div className="filters">
          <input
            placeholder="Search contractor/month/status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {message && <div className="banner success" style={{ marginBottom: 12 }}>{message}</div>}
      {error && <div className="banner error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="desktop-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Contractor</th>
              <th>Month</th>
              <th>Status</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ts) => (
              <tr
                key={ts.id}
                className={`release-row-clickable ${selected?.id === ts.id ? 'active' : ''}`}
                onClick={() => setSelectedId(ts.id)}
              >
                <td>{ts.contractor?.fullName || '-'}</td>
                <td>{formatMonth(ts.release?.monthYear)}</td>
                <td>{ts.status}</td>
                <td>{(ts.entries || []).reduce((sum, e) => sum + Number(e.hoursWorked || 0), 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div style={{ marginTop: 14 }}>
          <div className="topbar" style={{ marginBottom: 8 }}>
            <h4 style={{ margin: 0 }}>
              {selected.contractor?.fullName || '-'} | {formatMonth(selected.release?.monthYear)}
            </h4>
            <strong>Total Hours: {totalHours}</strong>
          </div>
          <div className="desktop-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {(selected.entries || []).map((entry) => (
                  <tr key={entry.id || `${entry.workDate}-${entry.entryType}`}>
                    <td>{entry.workDate}</td>
                    <td>{entry.entryType}</td>
                    <td>{entry.comment || '-'}</td>
                    <td>{entry.hoursWorked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12 }}>
            <textarea
              className="events-input events-textarea"
              placeholder="Reason for rejection (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <div className="actions">
            <button className="btn cancel" type="button" onClick={() => decide(false)} disabled={saving}>
              Reject
            </button>
            <button className="btn primary" type="button" onClick={() => decide(true)} disabled={saving}>
              Approve All Tasks
            </button>
          </div>
        </div>
      ) : (
        <div className="banner">No submitted timesheets pending approval.</div>
      )}
    </div>
  );
}
