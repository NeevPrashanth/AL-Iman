import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchReleases, releaseTimesheet } from '../../api';

const DEFAULT_DATE_BOXES = 4;

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

function isPastMonth(monthValue) {
  if (!monthValue) return false;
  const [year, month] = monthValue.split('-').map(Number);
  const selectedMonth = new Date(year, month - 1, 1);
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return selectedMonth < currentMonth;
}

function normalizeMonthDates(rawDates, monthValue) {
  const seen = new Set();
  return (rawDates || [])
    .filter((dateValue) => isDateInMonth(dateValue, monthValue))
    .filter((dateValue) => {
      if (seen.has(dateValue)) return false;
      seen.add(dateValue);
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
}

function formatReleaseMonth(monthYear) {
  if (!monthYear) return '';
  const [year, month] = monthYear.split('-').map(Number);
  if (!year || !month) return monthYear;
  return new Date(year, month - 1, 1).toLocaleString('en-GB', { month: 'long', year: '2-digit' });
}

function formatReleaseDateShort(dateValue) {
  if (!dateValue) return '';
  const parts = dateValue.split('-');
  if (parts.length !== 3) return dateValue;
  return `${parts[1]}-${parts[2]}`;
}

function toMonthInputValue(monthYear) {
  if (!monthYear) return '';
  const parts = monthYear.split('-');
  if (parts.length < 2) return '';
  return `${parts[0]}-${parts[1]}`;
}

export default function ReleasesPage({ session }) {
  const [month, setMonth] = useState('');
  const [dates, setDates] = useState(['']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPastMonthNotice, setShowPastMonthNotice] = useState(false);
  const [releases, setReleases] = useState([]);
  const [openCalendarIndex, setOpenCalendarIndex] = useState(null);
  const monthMeta = useMemo(() => getMonthMeta(month), [month]);
  const isPastMonthSelection = useMemo(() => isPastMonth(month), [month]);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const datePickerRef = useRef(null);
  const monthInputRef = useRef(null);

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
    if (!showPastMonthNotice) return undefined;
    const timer = setTimeout(() => {
      setShowPastMonthNotice(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showPastMonthNotice]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setOpenCalendarIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    if (!month) {
      setDates(['']);
      setOpenCalendarIndex(null);
      return;
    }
    const selectedMonthRelease = releases.find((release) => release.monthYear?.startsWith(`${month}-`));
    const existingDates = normalizeMonthDates(
      (selectedMonthRelease?.releaseDates || []).map((entry) => entry.workDate),
      month
    );
    if (existingDates.length > 0) {
      setDates(existingDates);
      setOpenCalendarIndex(null);
      return;
    }
    if (isPastMonth(month)) {
      setDates(['']);
      setOpenCalendarIndex(null);
      return;
    }
    setDates(Array.from({ length: DEFAULT_DATE_BOXES }, () => ''));
    setOpenCalendarIndex(null);
  }, [month, releases]);

  const submit = async (e) => {
    e.preventDefault();
    if (isPastMonthSelection) return;
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

  const updateDate = (idx, value) => {
    if (isPastMonthSelection) return;
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
  const insertDateRowAfter = (idx) => {
    if (isPastMonthSelection) return;
    setDates((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, '');
      return next;
    });
    setOpenCalendarIndex(null);
  };
  const removeDateRow = (idx) => {
    if (isPastMonthSelection) return;
    setDates((prev) => {
      if (prev.length <= 1) return [''];
      const next = prev.filter((_, index) => index !== idx);
      return next.length ? next : [''];
    });
    setOpenCalendarIndex((prev) => {
      if (prev === null) return null;
      if (prev === idx) return null;
      if (prev > idx) return prev - 1;
      return prev;
    });
  };

  const updateMonth = (nextMonth) => {
    setMonth(nextMonth);
    setOpenCalendarIndex(null);
    setError('');
    setShowPastMonthNotice(isPastMonth(nextMonth));
  };
  const handleReleaseRowClick = (monthValue) => {
    updateMonth(monthValue);
    if (window.matchMedia('(max-width: 1024px)').matches) {
      requestAnimationFrame(() => {
        monthInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div className="page-card">
      <h3>Release Timesheet</h3>
      {message && <div className="banner success">{message}</div>}
      {error && <div className="banner error">{error}</div>}
      <form onSubmit={submit}>
        <label>Month (first day)</label>
        <input
          ref={monthInputRef}
          className="release-month-input"
          type="month"
          value={month}
          onChange={(e) => updateMonth(e.target.value)}
          required
        />
        <div ref={datePickerRef}>
          <div style={{ marginBottom: 6 }}>
            <span>Allowed dates (default 4 Saturdays). Leave empty to auto-generate.</span>
          </div>
          {isPastMonthSelection && showPastMonthNotice && (
            <div className="banner">Selected month is in the past. Dates are read-only.</div>
          )}
          <div className="release-date-fields">
            {dates.map((d, idx) => (
              <div key={idx} className="release-date-row">
                <input
                  type="text"
                  value={d}
                  placeholder={month ? 'Select date' : 'Select month first'}
                  readOnly
                  disabled={!month || isPastMonthSelection}
                  onClick={() => month && !isPastMonthSelection && setOpenCalendarIndex(idx)}
                  onFocus={() => month && !isPastMonthSelection && setOpenCalendarIndex(idx)}
                />
                <div className="release-date-actions">
                  <button
                    type="button"
                    className="btn secondary outline release-icon-btn"
                    onClick={() => updateDate(idx, '')}
                    disabled={!d || isPastMonthSelection}
                    title="Clear date"
                    aria-label="Clear date"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    className="btn secondary outline release-icon-btn"
                    onClick={() => insertDateRowAfter(idx)}
                    disabled={!month || isPastMonthSelection}
                    title="Add another date row"
                    aria-label="Add date row"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn secondary outline release-icon-btn"
                    onClick={() => removeDateRow(idx)}
                    disabled={dates.length <= 1 || isPastMonthSelection}
                    title="Remove this date row"
                    aria-label="Remove date row"
                  >
                    -
                  </button>
                </div>
                {monthMeta && openCalendarIndex === idx && !isPastMonthSelection && (
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
                            disabled={usedElsewhere || isPastMonthSelection}
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
        <button className="btn" disabled={isPastMonthSelection}>Release & notify</button>
      </form>
      <h4 style={{ marginTop: 16 }}>Existing releases</h4>
      <table>
        <thead><tr><th>Month</th><th>Dates</th></tr></thead>
        <tbody>
          {releases.map(r => (
            <tr
              key={r.id}
              className={`release-row-clickable ${toMonthInputValue(r.monthYear) === month ? 'active' : ''}`}
              onClick={() => handleReleaseRowClick(toMonthInputValue(r.monthYear))}
            >
              <td>{formatReleaseMonth(r.monthYear)}</td>
              <td>
                <div className="release-date-badges">
                  {(r.releaseDates || []).map((d) => (
                    <span key={`${r.id}-${d.workDate}`} className="release-date-badge">
                      {formatReleaseDateShort(d.workDate)}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
