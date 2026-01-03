import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

function parseDocs(docs) {
  try {
    const parsed = typeof docs === 'string' ? JSON.parse(docs) : docs;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export default function InstitutionEnrollmentRequests() {
  const [requests, setRequests] = useState([]);
  const [comments, setComments] = useState({});
  const [error, setError] = useState('');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const loadRequests = () => {
    api
      .get('/institution/enrollment-requests')
      .then((response) => setRequests(response.data.requests || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load requests.'));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/institution/enrollment-requests/${id}/${action}`, { comments: comments[id] || '' });
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Enrollment Requests</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      <div className="mt-6 space-y-4">
        {requests.length ? (
          requests.map((req) => (
            <Card key={req.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">{req.student?.firstName} {req.student?.lastName}</p>
                <p className="text-xs text-slate-500">Student ID: {req.studentInstitutionId}</p>
                {req.department && <p className="text-xs text-slate-500">Department: {req.department}</p>}
                {req.class && <p className="text-xs text-slate-500">Class: {req.class}</p>}
                {req.courseName && <p className="text-xs text-slate-500">Course: {req.courseName}</p>}
                <p className="text-xs text-slate-500">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                {parseDocs(req.supportingDocs).length ? (
                  <div className="text-xs text-slate-500">
                    <p className="font-semibold text-slate-600">Supporting Docs:</p>
                    {parseDocs(req.supportingDocs).map((doc) => (
                      <a
                        key={doc}
                        className="block text-primary hover:text-primary-hover"
                        href={`${backendUrl}${doc}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {doc}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-2">
                  <textarea
                    className="input"
                    rows="2"
                    placeholder="Comments (optional)"
                    value={comments[req.id] || ''}
                    onChange={(event) => setComments((prev) => ({ ...prev, [req.id]: event.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => handleAction(req.id, 'approve')}>Approve</Button>
                    <Button variant="ghost" onClick={() => handleAction(req.id, 'reject')}>Reject</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-slate-600">No pending requests.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
