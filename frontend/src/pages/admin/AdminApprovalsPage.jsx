import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

function parseChanges(changes) {
  try {
    const parsed = typeof changes === 'string' ? JSON.parse(changes) : changes;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function parseDocs(docs) {
  try {
    const parsed = typeof docs === 'string' ? JSON.parse(docs) : docs;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export default function AdminApprovalsPage() {
  const [students, setStudents] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [profileChanges, setProfileChanges] = useState([]);
  const [programRequests, setProgramRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState('');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const loadData = () => {
    Promise.all([
      api.get('/admin/pending/students'),
      api.get('/admin/pending/institutions'),
      api.get('/admin/pending/profile-changes'),
      api.get('/admin/pending/programs'),
    ])
      .then(([studentsRes, institutionsRes, profileRes, programRes]) => {
        setStudents(studentsRes.data.users || []);
        setInstitutions(institutionsRes.data.users || []);
        setProfileChanges(profileRes.data.requests || []);
        setProgramRequests(programRes.data.requests || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load approvals.'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (type, id, action, payload = {}) => {
    try {
      await api.post(`/admin/pending/${type}/${id}/${action}`, payload);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleReject = async (type, id, noteKey) => {
    const reason = notes[noteKey];
    if (!reason) {
      setError('A rejection reason or comment is required.');
      return;
    }
    await handleAction(type, id, 'reject', { reason, adminComments: reason });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Approvals</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-display font-semibold">Students</h3>
          <div className="mt-4 space-y-3 text-sm">
            {students.length ? (
              students.map((item) => (
                <div key={item.id} className="space-y-2 border-b border-slate-100 pb-3">
                  <div>
                    <p className="font-semibold text-slate-700">{item.student?.firstName} {item.student?.lastName}</p>
                    <p className="text-xs text-slate-500">{item.email}</p>
                    {item.student?.studentId && (
                      <p className="text-xs text-slate-500">Student ID: {item.student.studentId}</p>
                    )}
                    {item.student?.dateOfBirth && (
                      <p className="text-xs text-slate-500">
                        DOB: {new Date(item.student.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}
                    {item.student?.fatherName && (
                      <p className="text-xs text-slate-500">Father: {item.student.fatherName}</p>
                    )}
                    {item.student?.motherName && (
                      <p className="text-xs text-slate-500">Mother: {item.student.motherName}</p>
                    )}
                    {item.student?.phone && (
                      <p className="text-xs text-slate-500">Phone: {item.student.phone}</p>
                    )}
                    {item.student?.presentAddress && (
                      <p className="text-xs text-slate-500">Address: {item.student.presentAddress}</p>
                    )}
                    {item.student?.identityType && (
                      <p className="text-xs text-slate-500">Identity Type: {item.student.identityType}</p>
                    )}
                    {item.student?.identityNumber && (
                      <p className="text-xs text-slate-500">Identity: {item.student.identityNumber}</p>
                    )}
                    {item.student?.createdAt && (
                      <p className="text-xs text-slate-500">
                        Submitted: {new Date(item.student.createdAt).toLocaleDateString()}
                      </p>
                    )}
                    {item.student?.nidOrBirthCertImage && (
                      <a
                        className="block text-xs text-primary hover:text-primary-hover"
                        href={`${backendUrl}${item.student.nidOrBirthCertImage}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Identity Document
                      </a>
                    )}
                    {item.student?.studentPhoto && (
                      <a
                        className="block text-xs text-primary hover:text-primary-hover"
                        href={`${backendUrl}${item.student.studentPhoto}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Student Photo
                      </a>
                    )}
                  </div>
                  <input
                    className="input"
                    placeholder="Rejection reason (if needed)"
                    value={notes[`student-${item.student?.id}`] || ''}
                    onChange={(event) => setNotes((prev) => ({ ...prev, [`student-${item.student?.id}`]: event.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => handleAction('students', item.student?.id, 'approve')}>Approve</Button>
                    <Button variant="ghost" onClick={() => handleReject('students', item.student?.id, `student-${item.student?.id}`)}>Reject</Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No pending students.</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-display font-semibold">Institutions</h3>
          <div className="mt-4 space-y-3 text-sm">
            {institutions.length ? (
              institutions.map((item) => (
                <div key={item.id} className="space-y-2 border-b border-slate-100 pb-3">
                  <div>
                    <p className="font-semibold text-slate-700">{item.institution?.name}</p>
                    <p className="text-xs text-slate-500">{item.email}</p>
                    {item.institution?.type && (
                      <p className="text-xs text-slate-500">Type: {item.institution.type}</p>
                    )}
                    {item.institution?.phone && (
                      <p className="text-xs text-slate-500">Phone: {item.institution.phone}</p>
                    )}
                    {item.institution?.address && (
                      <p className="text-xs text-slate-500">Address: {item.institution.address}</p>
                    )}
                    {item.institution?.eiin && (
                      <p className="text-xs text-slate-500">EIIN: {item.institution.eiin}</p>
                    )}
                    {item.institution?.registrationNumber && (
                      <p className="text-xs text-slate-500">
                        Registration: {item.institution.registrationNumber}
                      </p>
                    )}
                    {item.institution?.board && (
                      <p className="text-xs text-slate-500">Board: {item.institution.board}</p>
                    )}
                    {item.institution?.authorityName && (
                      <p className="text-xs text-slate-500">
                        Authority: {item.institution.authorityName} ({item.institution.authorityTitle})
                      </p>
                    )}
                    {item.institution?.authoritySignature && (
                      <a
                        className="block text-xs text-primary hover:text-primary-hover"
                        href={`${backendUrl}${item.institution.authoritySignature}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Authority Signature
                      </a>
                    )}
                  </div>
                  <input
                    className="input"
                    placeholder="Rejection reason (if needed)"
                    value={notes[`institution-${item.institution?.id}`] || ''}
                    onChange={(event) => setNotes((prev) => ({ ...prev, [`institution-${item.institution?.id}`]: event.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => handleAction('institutions', item.institution?.id, 'approve')}>Approve</Button>
                    <Button variant="ghost" onClick={() => handleReject('institutions', item.institution?.id, `institution-${item.institution?.id}`)}>Reject</Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No pending institutions.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-display font-semibold">Profile Change Requests</h3>
          <div className="mt-4 space-y-4 text-sm">
            {profileChanges.length ? (
              profileChanges.map((request) => {
                const changes = parseChanges(request.changes);
                return (
                  <div key={request.id} className="space-y-2 border-b border-slate-100 pb-4">
                    <div>
                      <p className="font-semibold text-slate-700">{request.student?.firstName} {request.student?.lastName}</p>
                      <p className="text-xs text-slate-500">{request.student?.user?.email}</p>
                    </div>
                    <p className="text-xs text-slate-500">Reason: {request.reason}</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    {Object.entries(changes).map(([field, value]) => (
                      <p key={field}>
                        {field}: {value?.old || '-'} -> {value?.new || value}
                      </p>
                    ))}
                  </div>
                  {parseDocs(request.supportingDocs).length ? (
                    <div className="text-xs text-slate-500">
                      <p className="font-semibold text-slate-600">Supporting Docs:</p>
                      {parseDocs(request.supportingDocs).map((doc) => (
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
                    <input
                      className="input"
                      placeholder="Admin comments (required for reject)"
                      value={notes[`profile-${request.id}`] || ''}
                      onChange={(event) => setNotes((prev) => ({ ...prev, [`profile-${request.id}`]: event.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => handleAction('profile-changes', request.id, 'approve', { adminComments: notes[`profile-${request.id}`] || '' })}>
                        Approve
                      </Button>
                      <Button variant="ghost" onClick={() => handleReject('profile-changes', request.id, `profile-${request.id}`)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500">No profile change requests.</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-display font-semibold">Program Requests</h3>
          <div className="mt-4 space-y-4 text-sm">
            {programRequests.length ? (
              programRequests.map((request) => (
                <div key={request.id} className="space-y-2 border-b border-slate-100 pb-4">
                  <div>
                    <p className="font-semibold text-slate-700">{request.programName}</p>
                    <p className="text-xs text-slate-500">{request.institution?.name}</p>
                    <p className="text-xs text-slate-500">{request.programType}</p>
                  </div>
                  <p className="text-xs text-slate-500">{request.description}</p>
                  {parseDocs(request.supportingDocs).length ? (
                    <div className="text-xs text-slate-500">
                      <p className="font-semibold text-slate-600">Supporting Docs:</p>
                      {parseDocs(request.supportingDocs).map((doc) => (
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
                  <input
                    className="input"
                    placeholder="Admin comments (required for reject)"
                    value={notes[`program-${request.id}`] || ''}
                    onChange={(event) => setNotes((prev) => ({ ...prev, [`program-${request.id}`]: event.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => handleAction('programs', request.id, 'approve', { adminComments: notes[`program-${request.id}`] || '' })}>
                      Approve
                    </Button>
                    <Button variant="ghost" onClick={() => handleReject('programs', request.id, `program-${request.id}`)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No program requests.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
