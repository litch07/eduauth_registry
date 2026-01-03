import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function InstitutionDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/institution/dashboard')
      .then((response) => setData(response.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard.'));
  }, []);

  if (error) {
    return <p className="px-6 py-10 text-sm text-error">{error}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Institution Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Operational overview and recent activity.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ['Enrolled Students', data?.stats?.enrolledStudents || 0],
          ['Certificates Issued', data?.stats?.certificatesIssued || 0],
          ['Pending Requests', data?.stats?.pendingRequests || 0],
          ['Active Programs', data?.stats?.activePrograms || 0],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-display font-semibold text-primary">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-display font-semibold">Recent Certificates</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {data?.recentCertificates?.length ? (
              data.recentCertificates.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>{item.student?.firstName} {item.student?.lastName}</span>
                  <span>{item.serial}</span>
                </li>
              ))
            ) : (
              <li>No certificates issued yet.</li>
            )}
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <h3 className="text-lg font-display font-semibold">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/institution/enroll">
              <Button variant="secondary">Enroll Student</Button>
            </Link>
            <Link to="/institution/certificates">
              <Button variant="ghost">Issue Certificate</Button>
            </Link>
            <Link to="/institution/enrollment-requests">
              <Button variant="ghost">Review Requests</Button>
            </Link>
            <Link to="/institution/profile">
              <Button variant="ghost">Institution Profile</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
