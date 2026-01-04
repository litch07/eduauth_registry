import React, { useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function StudentEnrollmentRequests() {
  const [term, setTerm] = useState('');
  const [institutions, setInstitutions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [requestForm, setRequestForm] = useState({
    studentInstitutionId: '',
    enrollmentDate: '',
    department: '',
    className: '',
    courseName: '',
  });
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const searchInstitutions = async () => {
    setError('');
    try {
      const response = await api.get(`/student/institutions/search?term=${encodeURIComponent(term)}`);
      setInstitutions(response.data.institutions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed.');
    }
  };

  const loadRequests = async () => {
    const response = await api.get('/student/enrollment-requests');
    setRequests(response.data.requests || []);
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setError('');
    setMessage('');
    try {
      const payload = new FormData();
      payload.append('institutionId', selected.id);
      Object.entries(requestForm).forEach(([key, value]) => payload.append(key, value));
      supportingDocs.forEach((file) => payload.append('supportingDocs', file));
      await api.post('/student/enrollment-requests', payload);
      setMessage('Enrollment request submitted.');
      setSelected(null);
      setRequestForm({ studentInstitutionId: '', enrollmentDate: '', department: '', className: '', courseName: '' });
      setSupportingDocs([]);
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    }
  };

  const cancelRequest = async (id) => {
    setError('');
    try {
      await api.delete(`/student/enrollment-requests/${id}`);
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  React.useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Enrollment Requests</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {message && <p className="mt-2 text-sm text-success">{message}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-display font-semibold">Find Institution</h3>
          <div className="mt-4 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Search by name, EIIN, registration number"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
            <Button type="button" onClick={searchInstitutions}>
              Search
            </Button>
          </div>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {institutions.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="font-semibold text-slate-800">{inst.name}</p>
                  <p className="text-xs text-slate-500">{inst.type}</p>
                </div>
                <Button type="button" variant="ghost" onClick={() => setSelected(inst)}>
                  Select
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-display font-semibold">Request Enrollment</h3>
          {selected ? (
            <form onSubmit={submitRequest} className="mt-4 space-y-3">
              <p className="text-sm text-slate-600">Institution: {selected.name}</p>
              <input
                className="input"
                placeholder="Institution Student ID"
                value={requestForm.studentInstitutionId}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, studentInstitutionId: event.target.value }))}
                required
              />
              <input
                className="input"
                type="date"
                value={requestForm.enrollmentDate}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, enrollmentDate: event.target.value }))}
                required
              />
              <input
                className="input"
                placeholder="Department (optional)"
                value={requestForm.department}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, department: event.target.value }))}
              />
              <input
                className="input"
                placeholder="Class (optional)"
                value={requestForm.className}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, className: event.target.value }))}
              />
              <input
                className="input"
                placeholder="Course Name (optional)"
                value={requestForm.courseName}
                onChange={(event) => setRequestForm((prev) => ({ ...prev, courseName: event.target.value }))}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-600">Supporting documents (optional)</label>
                <input type="file" multiple onChange={(event) => setSupportingDocs(Array.from(event.target.files || []))} />
              </div>
              <Button type="submit">Submit Request</Button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Select an institution to submit a request.</p>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-display font-semibold">My Requests</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {requests.length ? (
              requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between border-b border-slate-100 py-2">
                  <div>
                    <span>{req.institution?.name}</span>
                    <p className="text-xs text-slate-500">{req.status}</p>
                    {req.institutionComments && (
                      <p className="text-xs text-slate-500">Comment: {req.institutionComments}</p>
                    )}
                  </div>
                  {req.status === 'PENDING' && (
                    <Button variant="ghost" onClick={() => cancelRequest(req.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p>No requests yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
