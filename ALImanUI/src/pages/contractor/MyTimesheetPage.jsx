import React, { useEffect, useState } from 'react';
import { fetchReleases, fetchTimesheetsForContractor, submitTimesheet } from '../../api';

const createEmptyRow = (comment = '') => ({
  workDate: '',
  hoursWorked: 0,
  entryType: 'WORK',
  comment,
});

const initialRows = [createEmptyRow('Reminder: fill by Saturday'), createEmptyRow(), createEmptyRow(), createEmptyRow()];
const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function MyTimesheetPage({ session }) {
  const [rows, setRows] = useState(initialRows);
  const [month, setMonth] = useState(getCurrentMonthValue);
  const [banner, setBanner] = useState('');
  const [error, setError] = useState('');
  const [release, setRelease] = useState(null);
  const [loadingRelease, setLoadingRelease] = useState(false);
  const [isApprovedMonth, setIsApprovedMonth] = useState(false);

  useEffect(() => {
    if (!month) {
      setRelease(null);
      setBanner('');
      setIsApprovedMonth(false);
      setRows(initialRows);
      return;
    }

    const loadRelease = async () => {
      setLoadingRelease(true);
      setError('');
      setIsApprovedMonth(false);
      try {
        const [allReleases, contractorTimesheets] = await Promise.all([
          fetchReleases(session.token),
          fetchTimesheetsForContractor(session.userId, session.token),
        ]);

        const monthKey = `${month}-01`;
        const match = allReleases.find(r => r.monthYear === monthKey);
        const existingTimesheet = (contractorTimesheets || []).find((t) => t.release?.monthYear === monthKey);
        const approved = (existingTimesheet?.status || '').toUpperCase() === 'APPROVED';
        setIsApprovedMonth(approved);

        if (match) {
          setRelease(match);
          if ((existingTimesheet?.entries || []).length > 0) {
            setRows(existingTimesheet.entries.map((entry) => ({
              ...createEmptyRow(),
              workDate: entry.workDate || '',
              hoursWorked: entry.hoursWorked ?? 0,
              entryType: entry.entryType || 'WORK',
              comment: entry.comment || '',
            })));
          } else {
            setRows(match.releaseDates?.map(d => ({ ...createEmptyRow(), workDate: d.workDate })) || initialRows);
          }
          setBanner(approved ? 'This month is approved. Editing is disabled.' : 'Timesheet released - please submit before Monday.');
        } else {
          setRelease(null);
          setBanner('');
          setError('No active release found for selected month.');
          setRows(initialRows);
        }
      } catch (err) {
        setRelease(null);
        setBanner('');
        setError(err.response?.data?.message || 'No active release found for selected month.');
        setRows(initialRows);
      } finally {
        setLoadingRelease(false);
      }
    };

    loadRelease();
  }, [month, session.token, session.userId]);

  const updateRow = (i, key, value) => {
    if (isApprovedMonth) return;
    const copy = [...rows];
    copy[i][key] = value;
    setRows(copy);
  };

  const submit = async () => {
    setError('');
    if (isApprovedMonth) return;
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
              <td><input type="date" value={row.workDate} disabled={isApprovedMonth} onChange={(e) => updateRow(idx, 'workDate', e.target.value)} /></td>
              <td>
                <select value={row.entryType} disabled={isApprovedMonth} onChange={(e) => updateRow(idx, 'entryType', e.target.value)}>
                  <option value="WORK">Work</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="SICK">Sickness</option>
                </select>
              </td>
              <td><input type="number" value={row.hoursWorked} disabled={isApprovedMonth} step="0.5" onChange={(e) => updateRow(idx, 'hoursWorked', e.target.value)} /></td>
              <td><input value={row.comment} disabled={isApprovedMonth} onChange={(e) => updateRow(idx, 'comment', e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button className="btn" type="button" onClick={submit} disabled={loadingRelease || !release?.id || isApprovedMonth}>
          {loadingRelease ? 'Checking release...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
