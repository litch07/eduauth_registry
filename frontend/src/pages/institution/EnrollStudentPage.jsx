import React, { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function EnrollStudentPage() {
  const [query, setQuery] = useState({ email: '', studentId: '', firstName: '', lastName: '', dateOfBirth: '' });
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    studentInstitutionId: '',
    enrollmentDate: '',
    department: '',
    className: '',
    courseName: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const search = async () => {
    setError('');
    setMessage('');
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    try {
      const response = await api.get(`/institution/students/search?${params.toString()}`);
      setResults(response.data.students || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed.');
    }
  };

  const enroll = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setError('');
    try {
      await api.post('/institution/enroll', {
        studentId: selected.id,
        ...form,
      });
      setMessage('Student enrolled successfully.');
      setSelected(null);
      setForm({ studentInstitutionId: '', enrollmentDate: '', department: '', className: '', courseName: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Enroll Student</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {message && <p className="mt-2 text-sm text-success">{message}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-display font-semibold">Search Student</h3>
          <div className="mt-4 space-y-3">
            <input className="input" placeholder="Email" value={query.email} onChange={(event) => setQuery((prev) => ({ ...prev, email: event.target.value }))} />
            <input className="input" placeholder="Student ID" value={query.studentId} onChange={(event) => setQuery((prev) => ({ ...prev, studentId: event.target.value }))} />
            <input className="input" placeholder="First name" value={query.firstName} onChange={(event) => setQuery((prev) => ({ ...prev, firstName: event.target.value }))} />
            <input className="input" placeholder="Last name" value={query.lastName} onChange={(event) => setQuery((prev) => ({ ...prev, lastName: event.target.value }))} />
            <input className="input" type="date" value={query.dateOfBirth} onChange={(event) => setQuery((prev) => ({ ...prev, dateOfBirth: event.target.value }))} />
            <Button type="button" onClick={search}>
              Search
            </Button>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {results.map((student) => (
              <div key={student.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="font-semibold text-slate-700">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-slate-500">{student.user?.email}</p>
                  <p className="text-xs text-slate-500">Student ID: {student.studentId}</p>
                  <p className="text-xs text-slate-500">DOB: {new Date(student.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <Button type="button" variant="ghost" onClick={() => setSelected(student)}>
                  Select
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-display font-semibold">Enrollment Details</h3>
          {selected ? (
            <form onSubmit={enroll} className="mt-4 space-y-3">
              <p className="text-sm text-slate-600">Student: {selected.firstName} {selected.lastName}</p>
              <input className="input" placeholder="Institution Student ID" value={form.studentInstitutionId} onChange={(event) => setForm((prev) => ({ ...prev, studentInstitutionId: event.target.value }))} required />
              <input className="input" type="date" value={form.enrollmentDate} onChange={(event) => setForm((prev) => ({ ...prev, enrollmentDate: event.target.value }))} required />
              <input className="input" placeholder="Department (optional)" value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} />
              <input className="input" placeholder="Class (optional)" value={form.className} onChange={(event) => setForm((prev) => ({ ...prev, className: event.target.value }))} />
              <input className="input" placeholder="Course name (optional)" value={form.courseName} onChange={(event) => setForm((prev) => ({ ...prev, courseName: event.target.value }))} />
              <Button type="submit">Enroll Student</Button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Select a student to fill enrollment details.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
