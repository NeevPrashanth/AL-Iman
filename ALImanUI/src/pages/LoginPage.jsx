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
    <div className="login-shell">
      <div className="page-card login-card">
        <div className="login-header">
          <img src={logo} alt="logo" className="login-logo" />
          <div>
            <div className="login-title">Al Iman Institute</div>
            <div className="login-subtitle">Timesheet Portal</div>
          </div>
        </div>
        <form onSubmit={submit}>
          <label className="login-label">Email</label>
          <input
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@alimaninstitute.co.uk"
          />
          <label className="login-label">Password</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
          {error && <div className="banner error login-error">{error}</div>}
          <button className="btn secondary login-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
