import React, { useEffect, useMemo, useState } from 'react';
import { createEvent, deleteEvent, fetchEvents, updateEvent } from '../../api';

const emptyForm = {
  title: '',
  eventDate: '',
  location: '',
  description: '',
  startTime: '',
  endTime: '',
};

export default function EventsPage({ session }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState('create');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    const data = await fetchEvents(session.token);
    setEvents(data || []);
  };

  useEffect(() => {
    load();
  }, [session.token]);

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return events;
    return events.filter((ev) =>
      [ev.title, ev.location, ev.description, ev.eventDate]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedSearch))
    );
  }, [events, searchTerm]);

  const openCreate = () => {
    setMode('create');
    setForm(emptyForm);
    setShowFormModal(true);
    setError('');
  };

  const openEdit = (eventItem) => {
    setMode('edit');
    setSelectedEventId(eventItem.id);
    setForm({
      title: eventItem.title || '',
      eventDate: eventItem.eventDate || '',
      location: eventItem.location || '',
      description: eventItem.description || '',
      startTime: eventItem.startTime || '',
      endTime: eventItem.endTime || '',
    });
    setShowFormModal(true);
    setError('');
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (mode === 'edit' && selectedEventId) {
        await updateEvent(selectedEventId, form, session.token, session.userId);
      } else {
        await createEvent(form, session.token, session.userId);
      }
      setShowFormModal(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save event.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setSaving(true);
    setError('');
    try {
      await deleteEvent(pendingDelete.id, session.token, session.userId);
      setShowDeleteModal(false);
      setPendingDelete(null);
      if (selectedEventId === pendingDelete.id) {
        setSelectedEventId(null);
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-card events-page">
      <div className="topbar events-topbar">
        <h3>Events</h3>
        <button className="btn" type="button" onClick={openCreate}>Add</button>
      </div>
      <div className="toolbar">
        <div />
        <div className="filters">
          <input
            placeholder="Search title/date/location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {error && <div className="banner error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="events-list">
        <div className="desktop-table-wrapper">
          <table className="events-table">
            <thead><tr><th>Date</th><th>Title</th><th>Location</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(ev => {
                const selected = selectedEventId === ev.id;
                return (
                  <tr
                    key={ev.id}
                    className={`release-row-clickable ${selected ? 'active' : ''}`}
                    onClick={() => setSelectedEventId(ev.id)}
                  >
                    <td>{ev.eventDate}</td>
                    <td>{ev.title}</td>
                    <td>{ev.location || '-'}</td>
                    <td>
                      <div className="events-actions">
                        <button
                          type="button"
                          className="events-icon-btn"
                          title="Edit"
                          aria-label="Edit event"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            openEdit(ev);
                          }}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="events-icon-btn danger"
                          title="Delete"
                          aria-label="Delete event"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            setPendingDelete(ev);
                            setShowDeleteModal(true);
                            setError('');
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="events-cards">
          {filtered.map((ev) => (
            <div className={`card events-card ${selectedEventId === ev.id ? 'active' : ''}`} key={`card-${ev.id}`}>
              <div className="card-row"><strong>Date:</strong> {ev.eventDate}</div>
              <div className="card-row"><strong>Title:</strong> {ev.title}</div>
              <div className="card-row"><strong>Location:</strong> {ev.location || '-'}</div>
              <div className="card-row"><strong>Description:</strong> {ev.description || '-'}</div>
              <div className="events-actions" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  className="events-icon-btn"
                  title="Edit"
                  aria-label="Edit event"
                  onClick={() => openEdit(ev)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="events-icon-btn danger"
                  title="Delete"
                  aria-label="Delete event"
                  onClick={() => {
                    setPendingDelete(ev);
                    setShowDeleteModal(true);
                    setError('');
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showFormModal && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="title">{mode === 'edit' ? 'Edit Event' : 'Add Event'}</div>
            <form onSubmit={submitForm}>
              <div className="form-group">
                <label>Title</label>
                <input className="events-input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input className="events-input" required type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Start time</label>
                <input className="events-input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="form-group">
                <label>End time</label>
                <input className="events-input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input className="events-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="events-input events-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="actions">
                <button className="btn cancel" type="button" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="title">Delete Event</div>
            <p>Are you sure you want to delete this event?</p>
            <div className="actions">
              <button className="btn cancel" type="button" onClick={() => setShowDeleteModal(false)}>No</button>
              <button className="btn primary" type="button" onClick={confirmDelete} disabled={saving}>
                {saving ? 'Deleting...' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
