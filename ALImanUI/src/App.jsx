import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ManagerDashboard from './pages/ManagerDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import { logout as apiLogout, changePassword } from './api';
import logo from '/logo.png';

const Menu = ({ role, isCompactMenuOpen, onToggleCompactMenu, onMenuItemClick }) => (
  <div className="sidebar">
    <div className="sidebar-top">
      <div className="logo-row">
        <img src={logo} alt="Al Iman" />
        <div>
          <div style={{ fontWeight: 800 }}>Al Iman</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Timesheets</div>
        </div>
      </div>
      <button
        type="button"
        className="menu-toggle"
        aria-label={isCompactMenuOpen ? 'Collapse menu' : 'Expand menu'}
        aria-expanded={isCompactMenuOpen}
        onClick={onToggleCompactMenu}
      >
        <span className="menu-toggle-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
    </div>
    <div className={`sidebar-nav ${isCompactMenuOpen ? 'open' : ''}`}>
      {role === 'LINE_MANAGER' ? (
        <>
          <NavLink end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manager" onClick={onMenuItemClick}>
            Dashboard
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manager/contractors" onClick={onMenuItemClick}>
            Contractors
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manager/releases" onClick={onMenuItemClick}>
            Release Dates
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manager/events" onClick={onMenuItemClick}>
            Events
          </NavLink>
        </>
      ) : (
        <>
          <NavLink end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/contractor" onClick={onMenuItemClick}>
            My Timesheet
          </NavLink>
          <NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/contractor/history" onClick={onMenuItemClick}>
            History / Downloads
          </NavLink>
        </>
      )}
    </div>
    <div className="sidebar-back" aria-hidden="true">&lsaquo;</div>
  </div>
);

function App() {
  const [session, setSession] = useState(null);
  const [isCompactMenuOpen, setIsCompactMenuOpen] = useState(false);
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
  const collapseMenuOnCompactScreens = () => {
    if (window.matchMedia('(max-width: 1024px)').matches) {
      setIsCompactMenuOpen(false);
    }
  };

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
      <Menu
        role={role}
        isCompactMenuOpen={isCompactMenuOpen}
        onToggleCompactMenu={() => setIsCompactMenuOpen((prev) => !prev)}
        onMenuItemClick={collapseMenuOnCompactScreens}
      />
      <div className="content">
        <div className="app-shell-top">
          {banner && <div className="banner success inline-banner">{banner}</div>}
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
              {pwdError && <div className="banner error">{pwdError}</div>}
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
