import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchReleases, releaseTimesheet } from '../../api';

function getMonthMeta(monthValue) {
  if (!monthValue) return null;
  const [year, month] = monthValue.split('-').map(Number);
  if (!year || !month) return null;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  return { year, month, daysInMonth, firstWeekday };
}

function isDateInMonth(dateValue, monthValue) {
  if (!dateValue || !monthValue) return false;
  return dateValue.startsWith(`${monthValue}-`);
}

export default function ReleasesPage({ session }) {
  const [month, setMonth] = useState('');
  const [dates, setDates] = useState(['']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [releases, setReleases] = useState([]);
  const [openCalendarIndex, setOpenCalendarIndex] = useState(null);
  const monthMeta = useMemo(() => getMonthMeta(month), [month]);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const datePickerRef = useRef(null);

  const load = () => fetchReleases(session.token).then(setReleases);
  useEffect(() => { load(); }, [session.token]);
  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, error]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setOpenCalendarIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const addDate = () => {
    setDates((prev) => {
      const next = [...prev, ''];
      setOpenCalendarIndex(next.length - 1);
      return next;
    });
  };
  const updateDate = (idx, value) => {
    if (value && !isDateInMonth(value, month)) {
      setError('Please select a date from the selected month only.');
      return;
    }
    if (value && dates.some((d, i) => i !== idx && d === value)) {
      setError('That date is already selected.');
      return;
    }
    const copy = [...dates];
    copy[idx] = value;
    setDates(copy);
    setError('');
  };

  const updateMonth = (nextMonth) => {
    setMonth(nextMonth);
    setOpenCalendarIndex(null);
    setDates((prev) => {
      const seen = new Set();
      return prev.map((d) => {
        if (!isDateInMonth(d, nextMonth)) return '';
        if (seen.has(d)) return '';
        seen.add(d);
        return d;
      });
    });
  };

  return (
    <div className="page-card">
      <h3>Release Timesheet</h3>
      {message && <div className="banner success">{message}</div>}
      {error && <div className="banner error">{error}</div>}
      <form onSubmit={submit}>
        <label>Month (first day)</label>
        <input className="release-month-input" type="month" value={month} onChange={(e) => updateMonth(e.target.value)} required />
        <div ref={datePickerRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Allowed dates (default 4 Saturdays). Leave empty to auto-generate.</span>
            <button type="button" className="btn secondary" onClick={addDate}>Add date</button>
          </div>
          <div className="release-date-fields">
            {dates.map((d, idx) => (
              <div key={idx} className="release-date-row">
                <input
                  type="text"
                  value={d}
                  placeholder={month ? 'Select date' : 'Select month first'}
                  readOnly
                  onClick={() => month && setOpenCalendarIndex(idx)}
                  onFocus={() => month && setOpenCalendarIndex(idx)}
                />
                <button
                  type="button"
                  className="btn secondary outline"
                  onClick={() => updateDate(idx, '')}
                  disabled={!d}
                >
                  Clear
                </button>
                {monthMeta && openCalendarIndex === idx && (
                  <div className="release-calendar popup">
                    <div className="release-calendar-header">
                      <strong>
                        {new Date(monthMeta.year, monthMeta.month - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
                      </strong>
                    </div>
                    <div className="release-calendar-grid release-calendar-weekdays">
                      {weekdays.map((day) => (
                        <div key={day} className="release-calendar-weekday">{day}</div>
                      ))}
                    </div>
                    <div className="release-calendar-grid">
                      {Array.from({ length: monthMeta.firstWeekday }).map((_, i) => (
                        <div key={`blank-${i}`} className="release-calendar-empty" aria-hidden="true" />
                      ))}
                      {Array.from({ length: monthMeta.daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateValue = `${month}-${String(day).padStart(2, '0')}`;
                        const usedElsewhere = dates.some((selectedDate, selectedIdx) => selectedIdx !== idx && selectedDate === dateValue);
                        const isActive = d === dateValue;
                        return (
                          <button
                            key={dateValue}
                            type="button"
                            className={`release-day-btn ${isActive ? 'active' : ''}`}
                            disabled={usedElsewhere}
                            onClick={() => {
                              updateDate(idx, dateValue);
                              setOpenCalendarIndex(null);
                            }}
                            title={usedElsewhere ? 'Already selected in another row' : dateValue}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
