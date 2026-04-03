import React, { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { fetchContractors, fetchTimesheetsForContractor } from '../../api';

const colors = ['#b28a3f', '#0f2b5b', '#1c7ed6'];

export default function DashboardHome({ session }) {
  const [contractors, setContractors] = useState([]);
  const [timesheets, setTimesheets] = useState([]);

  useEffect(() => {
    fetchContractors(undefined, session.token).then(setContractors);
    // load timesheets for first contractor (extend as needed)
    fetchTimesheetsForContractor(1, session.token).then(setTimesheets).catch(() => setTimesheets([]));
  }, [session.token]);

  const roleData = useMemo(() => {
    const counts = contractors.reduce((acc, c) => {
      acc[c.roleTitle] = (acc[c.roleTitle] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [contractors]);

  const contractorHours = useMemo(() => timesheets.flatMap(ts =>
    (ts.entries || []).map(e => ({ name: ts.contractor?.fullName || 'N/A', hours: Number(e.hoursWorked || 0) }))
  ), [timesheets]);

  return (
    <div className="page-card">
      <h3>Current Month Overview</h3>
      <div className="dashboard-overview-grid">
        <div className="page-card dashboard-overview-panel">
          <h4>Hours by Contractor</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={contractorHours}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="#0f2b5b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="page-card dashboard-overview-panel">
          <h4>Role Mix</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={roleData} dataKey="value" nameKey="name" outerRadius={80}>
                {roleData.map((_, idx) => <Cell key={idx} fill={colors[idx % colors.length]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
