import React, { useEffect, useState } from 'react';
import { createEvent, fetchEvents } from '../../api';

export default function EventsPage({ session }) {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', eventDate: '' });

  const load = async () => setEvents(await fetchEvents(session.token));
  useEffect(() => { load(); }, [session.token]);

  const submit = async (e) => {
    e.preventDefault();
    await createEvent(form, session.token, session.userId);
    setForm({ title: '', eventDate: '' });
    load();
  };

  return (
    <div className="page-card">
      <div className="topbar">
        <h3>Events</h3>
        <button className="btn" onClick={submit}>Save</button>
      </div>
      <form onSubmit={submit}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <input placeholder="Location" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
        <textarea placeholder="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', minHeight: 80 }} />
      </form>
      <table style={{ marginTop: 16 }}>
        <thead><tr><th>Date</th><th>Title</th><th>Location</th></tr></thead>
        <tbody>
          {events.map(ev => (
            <tr key={ev.id}>
              <td>{ev.eventDate}</td>
              <td>{ev.title}</td>
              <td>{ev.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
