import React, { useState } from 'react';
import { login } from '../api';
import logo from '/logo.png';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await login(email, password);
      onLogin(session);
    } catch (err) {
      setError(err.response?.data?.message || 'Sign in failed. Please check credentials.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#0f2b5b 0%, #0a1d3e 70%)' }}>
      <div className="page-card" style={{ width: 420 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <img src={logo} alt="logo" style={{ height: 48 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Al Iman Institute</div>
            <div style={{ color: '#5f6b7a' }}>Timesheet Portal</div>
          </div>
        </div>
        <form onSubmit={submit}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@alimaninstitute.co.uk" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e3e7ed', marginBottom: 16 }} />
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #e3e7ed', marginBottom: 16 }} />
          {error && <div className="banner" style={{ marginBottom: 12 }}>{error}</div>}
          <button className="btn secondary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
