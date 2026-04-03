import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MyTimesheetPage from './contractor/MyTimesheetPage';
import HistoryPage from './contractor/HistoryPage';

export default function ContractorDashboard({ session }) {
  return (
    <>
      <Routes>
        <Route index element={<MyTimesheetPage session={session} />} />
        <Route path="history" element={<HistoryPage session={session} />} />
      </Routes>
    </>
  );
}
