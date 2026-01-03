import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/student/dashboard')
      .then((response) => setData(response.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard.'));
  }, []);

  if (error) {
    return <p className="px-6 py-10 text-sm text-error">{error}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Student Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Overview of your enrollments and certificates.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ['Enrolled Institutions', data?.stats?.enrollments || 0],
          ['Certificates', data?.stats?.certificates || 0],
          ['Pending Requests', data?.stats?.pendingRequests || 0],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-display font-semibold text-primary">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-display font-semibold">Enrollments</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {data?.enrollments?.length ? (
              data.enrollments.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>{item.institution?.name}</span>
                  <span>{new Date(item.enrollmentDate).toLocaleDateString()}</span>
                </li>
              ))
            ) : (
              <li>No enrollments yet.</li>
            )}
          </ul>
        </Card>

        <Card>
          <h3 className="text-lg font-display font-semibold">Certificates</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {data?.certificates?.length ? (
              data.certificates.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>{item.certificateType}</span>
                  <span>{item.serial}</span>
                </li>
              ))
            ) : (
              <li>No certificates issued yet.</li>
            )}
          </ul>
        </Card>
        <Card>
          <h3 className="text-lg font-display font-semibold">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/student/enrollment-requests">
              <Button variant="secondary">Request Enrollment</Button>
            </Link>
            <Link to="/student/certificates">
              <Button variant="ghost">View Certificates</Button>
            </Link>
            <Link to="/student/profile">
              <Button variant="ghost">Update Profile</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
