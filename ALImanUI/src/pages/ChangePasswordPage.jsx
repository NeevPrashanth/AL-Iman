import React, { useState } from 'react';
import { changePassword } from '../api';

export default function ChangePasswordPage({ session, onDone }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError('New password and confirm do not match.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword, session.token);
      setMessage('Password updated. Please log in again.');
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-card" style={{ maxWidth: 480 }}>
      <h3>Change password</h3>
      {message && <div className="banner">{message}</div>}
      {error && <div className="banner">{error}</div>}
      <form onSubmit={submit}>
        <label>Current password</label>
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
        <label>New password</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
        <label>Confirm new password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ width: '100%', marginBottom: 16 }} />
        <button className="btn" disabled={loading}>{loading ? 'Saving...' : 'Change password'}</button>
      </form>
    </div>
  );
}
