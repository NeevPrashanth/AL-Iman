import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import ContractorsPage from './manager/ContractorsPage';
import ReleasesPage from './manager/ReleasesPage';
import EventsPage from './manager/EventsPage';
import ApprovalsPage from './manager/ApprovalsPage';
import DashboardHome from './manager/DashboardHome';

export default function ManagerDashboard({ session }) {
  return (
    <>
      <Routes>
        <Route index element={<DashboardHome session={session} />} />
        <Route path="contractors" element={<ContractorsPage session={session} />} />
        <Route path="releases" element={<ReleasesPage session={session} />} />
        <Route path="approvals" element={<ApprovalsPage session={session} />} />
        <Route path="events" element={<EventsPage session={session} />} />
      </Routes>
    </>
  );
}
