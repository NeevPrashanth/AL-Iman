import React, { useEffect, useMemo, useState } from 'react';
import { createContractor, fetchContractors, fetchRoles, updateContractor } from '../../api';

const emptyForm = { fullName: '', email: '', hourlyRate: 0, roleTitle: '', startDate: '', endDate: '' };

export default function ContractorsPage({ session }) {
  const [contractors, setContractors] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tab, setTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const load = async () => setContractors(await fetchContractors(undefined, session.token));
  const loadRoles = async () => setRoles(await fetchRoles(session.token));

  useEffect(() => {
    load();
    loadRoles();
  }, [session.token]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
    setError('');
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      fullName: c.fullName,
      email: c.email,
      hourlyRate: c.hourlyRate,
      roleTitle: c.roleTitle,
      startDate: c.startDate,
      endDate: c.endDate || ''
    });
    setShowModal(true);
    setError('');
  };

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return contractors.filter((c) => {
      const end = c.endDate;
      const isArchived = end && end < today;
      const inTab = tab === 'active' ? !isArchived : isArchived;
      if (!inTab) return false;
      if (!normalizedSearch) return true;

      return [c.fullName, c.email, c.roleTitle]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(normalizedSearch));
    });
  }, [contractors, tab, searchTerm]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateContractor(editingId, { ...form, startDate: form.startDate }, session.token);
      } else {
        await createContractor({ ...form, startDate: form.startDate }, session.token);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save contractor.');
    }
  };

  return (
    <div className="page-card">
      <div className="topbar">
        <h3>Contractors</h3>
        <button className="btn" onClick={openAdd}>Add Contractor</button>
      </div>

      <div className="toolbar contractors-toolbar">
        <div className="tab-group">
          <button className={`btn secondary ${tab === 'active' ? '' : 'outline'}`} onClick={() => setTab('active')}>Active</button>
          <button className={`btn secondary ${tab === 'archive' ? '' : 'outline'}`} onClick={() => setTab('archive')}>Archive</button>
        </div>
        <div className="filters">
          <input
            placeholder="Search name/email/role"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="desktop-table-wrapper">
        <table className="desktop-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Rate</th>
              <th>Start</th>
              <th>End</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>{c.fullName}</td>
                <td>{c.roleTitle}</td>
                <td>{c.email}</td>
                <td>GBP {Number(c.hourlyRate).toFixed(2)}</td>
                <td>{c.startDate}</td>
                <td>{c.endDate || '-'}</td>
                <td><button className="btn secondary table-action" onClick={() => openEdit(c)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="contractor-cards">
        {filtered.map((c) => (
          <div className="card contractor-card" key={c.id}>
            <div className="card-row"><strong>Name:</strong> {c.fullName}</div>
            <div className="card-row"><strong>Role:</strong> {c.roleTitle}</div>
            <div className="card-row"><strong>Email:</strong> {c.email}</div>
            <div className="card-row"><strong>Rate:</strong> GBP {Number(c.hourlyRate).toFixed(2)}</div>
            <div className="card-row"><strong>Start:</strong> {c.startDate}</div>
            <div className="card-row"><strong>End:</strong> {c.endDate || '-'}</div>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <button className="btn secondary table-action" onClick={() => openEdit(c)}>Edit</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="overlay">
          <div className="modal">
            <div className="title">
              <span>{editingId ? 'Edit Contractor' : 'Add Contractor'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>x</button>
            </div>
            {error && <div className="banner">{error}</div>}
            <form onSubmit={submit}>
              <div className="form-group">
                <label>Name</label>
                <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Enter full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter email address" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select required value={form.roleTitle} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}>
                  <option value="">Select role</option>
                  {roles.map((r) => <option key={r.id} value={r.label}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Hourly Rate (GBP)</label>
                <input required type="number" step="0.01" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} placeholder="0.00" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Start Date</label>
                  <input required type="date" value={form.startDate} disabled={!!editingId} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="actions">
                <button type="button" className="btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn primary" type="submit">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
