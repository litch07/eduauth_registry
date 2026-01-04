import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

const statusOptions = ['', 'PENDING_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [error, setError] = useState('');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const loadStudents = async () => {
    try {
      setError('');
      const response = await api.get('/admin/students', {
        params: {
          search: filters.search || undefined,
          status: filters.status || undefined,
        },
      });
      setStudents(response.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students.');
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Students</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      <Card className="mt-6">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="input"
            placeholder="Search by name, email, student ID, phone"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <select
            className="input"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status || 'All statuses'}
              </option>
            ))}
          </select>
          <Button type="button" onClick={loadStudents}>
            Search
          </Button>
        </div>
      </Card>

      <div className="mt-6 space-y-4">
        {students.length ? (
          students.map((item) => (
            <Card key={item.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {item.student?.firstName} {item.student?.middleName} {item.student?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{item.email}</p>
                </div>
                <span className="text-xs font-semibold text-primary">{item.status}</span>
              </div>
              <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                {item.student?.studentId && <p>Student ID: {item.student.studentId}</p>}
                {item.student?.dateOfBirth && (
                  <p>DOB: {new Date(item.student.dateOfBirth).toLocaleDateString()}</p>
                )}
                {item.student?.phone && <p>Phone: {item.student.phone}</p>}
                {item.student?.presentAddress && <p>Address: {item.student.presentAddress}</p>}
                {item.student?.identityType && <p>Identity Type: {item.student.identityType}</p>}
                {item.student?.identityNumber && <p>Identity: {item.student.identityNumber}</p>}
                {item.student?.createdAt && (
                  <p>Registered: {new Date(item.student.createdAt).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {item.student?.nidOrBirthCertImage && (
                  <a
                    className="text-primary hover:text-primary-hover"
                    href={`${backendUrl}${item.student.nidOrBirthCertImage}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Identity Document
                  </a>
                )}
                {item.student?.studentPhoto && (
                  <a
                    className="text-primary hover:text-primary-hover"
                    href={`${backendUrl}${item.student.studentPhoto}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Student Photo
                  </a>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-slate-600">No students found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
