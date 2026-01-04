import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((response) => setData(response.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard.'));
  }, []);

  if (error) {
    return <p className="px-6 py-10 text-sm text-error">{error}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">System overview and activity logs.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ['Pending Students', data?.stats?.pendingStudents || 0, '/admin/approvals'],
          ['Pending Institutions', data?.stats?.pendingInstitutions || 0, '/admin/approvals'],
          ['Pending Profile Changes', data?.stats?.pendingProfileChanges || 0, '/admin/approvals'],
          ['Pending Programs', data?.stats?.pendingPrograms || 0, '/admin/approvals'],
        ].map(([label, value, to]) => (
          <Link key={label} to={to} className="block">
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-display font-semibold text-primary">{value}</p>
              <p className="mt-2 text-xs text-slate-500">View details</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          ['Total Students', data?.stats?.totalStudents || 0, '/admin/students'],
          ['Total Institutions', data?.stats?.totalInstitutions || 0, '/admin/institutions'],
          ['Total Certificates', data?.stats?.totalCertificates || 0, '/admin/certificates'],
        ].map(([label, value, to]) => (
          <Link key={label} to={to} className="block">
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-display font-semibold text-primary">{value}</p>
              <p className="mt-2 text-xs text-slate-500">View records</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-display font-semibold">Recent Activity</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {data?.recentLogs?.length ? (
              data.recentLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between">
                  <span>{log.action}</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </li>
              ))
            ) : (
              <li>No activity logs yet.</li>
            )}
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <h3 className="text-lg font-display font-semibold">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/admin/approvals">
              <Button variant="secondary">Review Approvals</Button>
            </Link>
            <Link to="/admin/students">
              <Button variant="ghost">View Students</Button>
            </Link>
            <Link to="/admin/institutions">
              <Button variant="ghost">Manage Institutions</Button>
            </Link>
            <Link to="/admin/certificates">
              <Button variant="ghost">Search Certificates</Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="ghost">Issue Reports</Button>
            </Link>
            <Link to="/admin/logs">
              <Button variant="ghost">Activity Logs</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
