import React, { useEffect, useState } from 'react';
import { createEvent, fetchEvents } from '../../api';

export default function EventsPage({ session }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [form, setForm] = useState({ title: '', eventDate: '' });
  const todayKey = new Date().toISOString().slice(0, 10);
  const isPastEvent = (eventDate) => !!eventDate && eventDate < todayKey;

  const load = async () => setEvents(await fetchEvents(session.token));
  useEffect(() => { load(); }, [session.token]);

  const submit = async (e) => {
    e.preventDefault();
    await createEvent(form, session.token, session.userId);
    setForm({ title: '', eventDate: '' });
    setSelectedEventId(null);
    load();
  };
  const selectEvent = (eventItem) => {
    if (isPastEvent(eventItem.eventDate)) return;
    setSelectedEventId(eventItem.id);
    setForm({
      title: eventItem.title || '',
      eventDate: eventItem.eventDate || '',
      location: eventItem.location || '',
      description: eventItem.description || '',
    });
  };

  return (
    <div className="page-card events-page">
      <div className="topbar events-topbar">
        <h3>Events</h3>
        <button className="btn" type="submit" form="events-form">Save</button>
      </div>
      <form id="events-form" className="events-form" onSubmit={submit}>
        <input className="events-input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input className="events-input" type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
        <input className="events-input" placeholder="Location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <textarea className="events-input events-textarea" placeholder="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </form>
      <div className="events-list">
        <div className="desktop-table-wrapper">
          <table>
            <thead><tr><th>Date</th><th>Title</th><th>Location</th></tr></thead>
            <tbody>
              {events.map(ev => (
                <tr
                  key={ev.id}
                  className={`events-row ${isPastEvent(ev.eventDate) ? 'disabled' : 'release-row-clickable'} ${selectedEventId === ev.id ? 'active' : ''}`}
                  onClick={() => selectEvent(ev)}
                >
                  <td>{ev.eventDate}</td>
                  <td>{ev.title}</td>
                  <td>{ev.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="events-cards">
          {events.map((ev) => (
            <div
              key={`card-${ev.id}`}
              className={`card events-card ${isPastEvent(ev.eventDate) ? 'disabled' : 'release-row-clickable'} ${selectedEventId === ev.id ? 'active' : ''}`}
              onClick={() => selectEvent(ev)}
            >
              <div className="card-row"><strong>Date:</strong> {ev.eventDate}</div>
              <div className="card-row"><strong>Title:</strong> {ev.title}</div>
              <div className="card-row"><strong>Location:</strong> {ev.location || '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
