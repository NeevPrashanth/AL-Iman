import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import MyTimesheetPage from './contractor/MyTimesheetPage';
import HistoryPage from './contractor/HistoryPage';

export default function ContractorDashboard({ session }) {
  return (
    <>
      <div className="topbar">
        <h2 style={{ margin: 0 }}>Contractor</h2>
      </div>
      <Routes>
        <Route index element={<MyTimesheetPage session={session} />} />
        <Route path="history" element={<HistoryPage session={session} />} />
      </Routes>
    </>
  );
}
