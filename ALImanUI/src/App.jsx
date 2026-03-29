import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ManagerDashboard from './pages/ManagerDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import { logout as apiLogout, changePassword } from './api';
import logo from '/logo.png';

const Menu = ({ role }) => (
  <div className="sidebar">
    <div className="logo-row">
      <img src={logo} alt="Al Iman" />
      <div>
        <div style={{ fontWeight: 800 }}>Al Iman</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Timesheets</div>
      </div>
    </div>
    {role === 'LINE_MANAGER' ? (
      <>
        <NavLink end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manager">
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manager/contractors">
          Contractors
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manager/releases">
          Release Dates
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manager/events">
          Events
        </NavLink>
      </>
    ) : (
      <>
        <NavLink end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/contractor">
          My Timesheet
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/contractor/history">
          History / Downloads
        </NavLink>
      </>
    )}
    <div className="sidebar-back" aria-hidden="true">&lsaquo;</div>
  </div>
);

function App() {
  const [session, setSession] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [banner, setBanner] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await apiLogout();
    setSession(null);
  };

  const openPwdModal = () => {
    setPwdForm({ current: '', next: '', confirm: '' });
    setPwdError('');
    setShowPwdModal(true);
    setShowUserMenu(false);
  };

  const submitPwd = async (e) => {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdError('New passwords do not match.');
      return;
    }
    setPwdError('');
    try {
      await changePassword(pwdForm.current, pwdForm.next, session.token);
      const newToken = `Basic ${btoa(`${session.email}:${pwdForm.next}`)}`;
      setSession({ ...session, token: newToken });
      setShowPwdModal(false);
      setBanner('Password updated');
      setTimeout(() => setBanner(''), 3000);
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Could not update password.');
    }
  };

  if (!session) {
    return <LoginPage onLogin={(s) => { setShowUserMenu(false); setSession(s); }} />;
  }

  const role = session.role;

  const UserChip = () => (
    <div className="user-chip" onClick={() => setShowUserMenu((s) => !s)}>
      <div className="user-chip-avatar">{session.fullName ? session.fullName[0].toUpperCase() : 'U'}</div>
      <div className="user-chip-text">
        <div className="user-chip-welcome">Welcome, {session.fullName || session.email}</div>
        <div className="user-chip-role">as {session.role}</div>
      </div>
    </div>
  );

  return (
    <div className="layout">
      <Menu role={role} />
      <div className="content">
        <div className="app-shell-top">
          {banner && <div className="banner inline-banner">{banner}</div>}
          <div ref={userMenuRef}>
            <UserChip />
            {showUserMenu && (
              <div className="user-menu">
                <button className="user-menu-item" onClick={openPwdModal}>Change password</button>
                <button className="user-menu-item" onClick={handleLogout}>Log out</button>
              </div>
            )}
          </div>
        </div>

        <Routes>
          <Route path="/manager/*" element={role === 'LINE_MANAGER' ? <ManagerDashboard session={session} /> : <Navigate to="/contractor" replace />} />
          <Route path="/contractor/*" element={role === 'CONTRACTOR' ? <ContractorDashboard session={session} /> : <Navigate to="/manager" replace />} />
          <Route path="*" element={<Navigate to={role === 'LINE_MANAGER' ? '/manager' : '/contractor'} replace />} />
        </Routes>

        {showPwdModal && (
          <div className="overlay">
            <div className="modal">
              <div className="title">
                <span>Change Password</span>
                <button onClick={() => setShowPwdModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>x</button>
              </div>
              {pwdError && <div className="banner">{pwdError}</div>}
              <form onSubmit={submitPwd}>
                <div className="form-group">
                  <label>Current password</label>
                  <input type="password" value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} placeholder="Enter current password" />
                </div>
                <div className="form-group">
                  <label>New password</label>
                  <input type="password" value={pwdForm.next} onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })} placeholder="Enter new password" />
                </div>
                <div className="form-group">
                  <label>Confirm new password</label>
                  <input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} placeholder="Re-enter new password" />
                </div>
                <div className="actions">
                  <button type="button" className="btn cancel" onClick={() => setShowPwdModal(false)}>Cancel</button>
                  <button className="btn primary" type="submit">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
