import React, { useEffect, useState } from 'react';
import { fetchReleases, releaseTimesheet } from '../../api';

export default function ReleasesPage({ session }) {
  const [month, setMonth] = useState('');
  const [dates, setDates] = useState(['']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [releases, setReleases] = useState([]);

  const load = () => fetchReleases(session.token).then(setReleases);
  useEffect(() => { load(); }, [session.token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      monthYear: month ? `${month}-01` : null,
      workDates: dates.filter(Boolean),
    };
    try {
      const resp = await releaseTimesheet(payload, session.token, session.userId);
      setMessage(`Released for ${resp.monthYear}`);
      load();
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.message || 'Could not release timesheet dates.');
    }
  };

  const addDate = () => setDates([...dates, '']);
  const updateDate = (idx, value) => {
    const copy = [...dates];
    copy[idx] = value;
    setDates(copy);
  };

  return (
    <div className="page-card">
      <h3>Release Timesheet</h3>
      {message && <div className="banner">{message}</div>}
      {error && <div className="banner">{error}</div>}
      <form onSubmit={submit}>
        <label>Month (first day)</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ display: 'block', marginBottom: 10 }} required />
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Allowed dates (default 4 Saturdays). Leave empty to auto-generate.</span>
            <button type="button" className="btn secondary" onClick={addDate}>Add date</button>
          </div>
          {dates.map((d, idx) => (
            <input key={idx} type="date" value={d} onChange={(e) => updateDate(idx, e.target.value)} style={{ marginBottom: 6, display: 'block' }} />
          ))}
        </div>
        <button className="btn">Release & notify</button>
      </form>
      <h4 style={{ marginTop: 16 }}>Existing releases</h4>
      <table>
        <thead><tr><th>Month</th><th>Dates</th></tr></thead>
        <tbody>
          {releases.map(r => (
            <tr key={r.id}>
              <td>{r.monthYear}</td>
              <td>{(r.releaseDates || []).map(d => d.workDate).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
