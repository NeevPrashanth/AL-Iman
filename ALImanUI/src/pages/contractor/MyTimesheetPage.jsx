import React, { useEffect, useMemo, useState } from 'react';
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
const formatDateLabel = (dateValue) => {
  if (!dateValue) return '-';
  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  const dayName = parsed.toLocaleString('en-GB', { weekday: 'short' }).toUpperCase();
  const dayNumber = String(parsed.getDate()).padStart(2, '0');
  return `${dayName}-${dayNumber}`;
};
const normalizeRowForCompare = (row) => ({
  workDate: row.workDate || '',
  entryType: row.entryType || 'WORK',
  hoursWorked: row.hoursWorked === '' ? '' : Number(row.hoursWorked || 0),
  comment: row.comment || '',
});
const normalizeRowsForCompare = (sourceRows) => (sourceRows || []).map(normalizeRowForCompare);

export default function MyTimesheetPage({ session }) {
  const [rows, setRows] = useState(initialRows);
  const [baselineRows, setBaselineRows] = useState(normalizeRowsForCompare(initialRows));
  const [month, setMonth] = useState(getCurrentMonthValue);
  const [banner, setBanner] = useState('');
  const [error, setError] = useState('');
  const [release, setRelease] = useState(null);
  const [loadingRelease, setLoadingRelease] = useState(false);
  const [isApprovedMonth, setIsApprovedMonth] = useState(false);
  const isModified = useMemo(() => {
    const current = JSON.stringify(normalizeRowsForCompare(rows));
    const baseline = JSON.stringify(baselineRows);
    return current !== baseline;
  }, [rows, baselineRows]);

  useEffect(() => {
    if (!banner) return undefined;
    const timer = setTimeout(() => setBanner(''), 3000);
    return () => clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    if (!month) {
      setRelease(null);
      setBanner('');
      setIsApprovedMonth(false);
      setRows(initialRows);
      setBaselineRows(normalizeRowsForCompare(initialRows));
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
          let loadedRows = initialRows;
          if ((existingTimesheet?.entries || []).length > 0) {
            loadedRows = existingTimesheet.entries.map((entry) => ({
              ...createEmptyRow(),
              workDate: entry.workDate || '',
              hoursWorked: entry.hoursWorked ?? 0,
              entryType: entry.entryType || 'WORK',
              comment: entry.comment || '',
            }));
          } else {
            loadedRows = match.releaseDates?.map(d => ({ ...createEmptyRow(), workDate: d.workDate })) || initialRows;
          }
          setRows(loadedRows);
          setBaselineRows(normalizeRowsForCompare(loadedRows));
          setBanner(approved ? 'This month is approved. Editing is disabled.' : 'Timesheet released - please submit before Monday.');
        } else {
          setRelease(null);
          setBanner('');
          setError('No active release found for selected month.');
          setRows(initialRows);
          setBaselineRows(normalizeRowsForCompare(initialRows));
        }
      } catch (err) {
        setRelease(null);
        setBanner('');
        setError(err.response?.data?.message || 'No active release found for selected month.');
        setRows(initialRows);
        setBaselineRows(normalizeRowsForCompare(initialRows));
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
      setBaselineRows(normalizeRowsForCompare(rows));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit timesheet.');
    }
  };

  return (
    <div className="page-card timesheet-page">
      <h3>My Timesheet</h3>
      {banner && <div className={`banner ${isApprovedMonth ? '' : 'success'} timesheet-banner`}>{banner}</div>}
      {error && <div className="banner error timesheet-banner">{error}</div>}
      <div className="timesheet-month-row">
        <label className="timesheet-month-label">Month</label>
        <input className="release-month-input timesheet-month-input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>
      <div className="timesheet-desktop-table">
        <table className="timesheet-table">
          <colgroup>
            <col className="timesheet-col-date" />
            <col className="timesheet-col-type" />
            <col className="timesheet-col-hours" />
            <col className="timesheet-col-comment" />
          </colgroup>
          <thead>
            <tr><th>Date</th><th>Type</th><th>Hours</th><th>Comment</th></tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td><span className="timesheet-date-label">{formatDateLabel(row.workDate)}</span></td>
                <td>
                  <select className="timesheet-select" value={row.entryType} disabled={isApprovedMonth} onChange={(e) => updateRow(idx, 'entryType', e.target.value)}>
                    <option value="WORK">Work</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="SICK">Sickness</option>
                  </select>
                </td>
                <td><input className="timesheet-input" type="number" value={row.hoursWorked} disabled={isApprovedMonth} step="0.5" onChange={(e) => updateRow(idx, 'hoursWorked', e.target.value)} /></td>
                <td><input className="timesheet-input" value={row.comment} disabled={isApprovedMonth} onChange={(e) => updateRow(idx, 'comment', e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="timesheet-mobile-cards">
        {rows.map((row, idx) => (
          <div key={idx} className="timesheet-mobile-card">
            <div className="timesheet-mobile-field">
              <label>Date</label>
              <span className="timesheet-date-label">{formatDateLabel(row.workDate)}</span>
            </div>
            <div className="timesheet-mobile-field">
              <label>Type</label>
              <select className="timesheet-select" value={row.entryType} disabled={isApprovedMonth} onChange={(e) => updateRow(idx, 'entryType', e.target.value)}>
                <option value="WORK">Work</option>
                <option value="HOLIDAY">Holiday</option>
                <option value="SICK">Sickness</option>
              </select>
            </div>
            <div className="timesheet-mobile-field">
              <label>Hours</label>
              <input className="timesheet-input" type="number" value={row.hoursWorked} disabled={isApprovedMonth} step="0.5" onChange={(e) => updateRow(idx, 'hoursWorked', e.target.value)} />
            </div>
            <div className="timesheet-mobile-field">
              <label>Comment</label>
              <input className="timesheet-input" value={row.comment} disabled={isApprovedMonth} onChange={(e) => updateRow(idx, 'comment', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <div className="timesheet-actions">
        <button className="btn timesheet-submit" type="button" onClick={submit} disabled={loadingRelease || !release?.id || isApprovedMonth || !isModified}>
          {loadingRelease ? 'Checking release...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
