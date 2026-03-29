import React, { useEffect, useState } from 'react';
import { fetchReleases, submitTimesheet } from '../../api';

const createEmptyRow = (comment = '') => ({
  workDate: '',
  hoursWorked: 0,
  entryType: 'WORK',
  comment,
});

const initialRows = [createEmptyRow('Reminder: fill by Saturday'), createEmptyRow(), createEmptyRow(), createEmptyRow()];

export default function MyTimesheetPage({ session }) {
  const [rows, setRows] = useState(initialRows);
  const [month, setMonth] = useState('');
  const [banner, setBanner] = useState('');
  const [error, setError] = useState('');
  const [release, setRelease] = useState(null);
  const [loadingRelease, setLoadingRelease] = useState(false);

  useEffect(() => {
    if (!month) {
      setRelease(null);
      setBanner('');
      return;
    }

    const loadRelease = async () => {
      setLoadingRelease(true);
      setError('');
      try {
        const all = await fetchReleases(session.token);
        const match = all.find(r => r.monthYear === `${month}-01`);
        if (match) {
          setRelease(match);
          setRows(match.releaseDates?.map(d => ({ ...createEmptyRow(), workDate: d.workDate })) || initialRows);
          setBanner('Timesheet released - please submit before Monday.');
        } else {
          setRelease(null);
          setBanner('');
          setError('No active release found for selected month.');
        }
      } catch (err) {
        setRelease(null);
        setBanner('');
        setError(err.response?.data?.message || 'No active release found for selected month.');
      } finally {
        setLoadingRelease(false);
      }
    };

    loadRelease();
  }, [month, session.token]);

  const updateRow = (i, key, value) => {
    const copy = [...rows];
    copy[i][key] = value;
    setRows(copy);
  };

  const addRow = () => setRows([...rows, createEmptyRow()]);

  const submit = async () => {
    setError('');
    if (!release?.id) {
      setError('Select a month with an active release before submitting.');
      return;
    }

    try {
      await submitTimesheet({
        contractorId: session.userId,
        releaseId: release.id,
        entries: rows,
      }, session.token);
      setBanner('Submitted for approval.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit timesheet.');
    }
  };

  return (
    <div className="page-card">
      <h3>My Timesheet</h3>
      {banner && <div className="banner">{banner}</div>}
      {error && <div className="banner">{error}</div>}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <label>Month</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>
      <table>
        <thead>
          <tr><th>Date</th><th>Type</th><th>Hours</th><th>Comment</th></tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td><input type="date" value={row.workDate} onChange={(e) => updateRow(idx, 'workDate', e.target.value)} /></td>
              <td>
                <select value={row.entryType} onChange={(e) => updateRow(idx, 'entryType', e.target.value)}>
                  <option value="WORK">Work</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="SICK">Sickness</option>
                </select>
              </td>
              <td><input type="number" value={row.hoursWorked} step="0.5" onChange={(e) => updateRow(idx, 'hoursWorked', e.target.value)} /></td>
              <td><input value={row.comment} onChange={(e) => updateRow(idx, 'comment', e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button className="btn secondary" type="button" onClick={addRow}>Add row</button>
        <button className="btn" type="button" onClick={submit} disabled={loadingRelease || !release?.id}>
          {loadingRelease ? 'Checking release...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
