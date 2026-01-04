import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

const issueTypes = [
  'certificate_not_received',
  'wrong_info',
  'account_access',
  'technical',
  'other',
];

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [updateForm, setUpdateForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    fatherName: '',
    motherName: '',
    presentAddress: '',
    nid: '',
    birthCert: '',
  });
  const [updateReason, setUpdateReason] = useState('');
  const [supportingDocs, setSupportingDocs] = useState([]);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [issueForm, setIssueForm] = useState({
    issueType: issueTypes[0],
    description: '',
    targetType: 'ADMIN',
    institutionId: '',
  });
  const [issueFiles, setIssueFiles] = useState([]);

  const currentDob = useMemo(() => {
    if (!profile?.dateOfBirth) return '';
    return new Date(profile.dateOfBirth).toISOString().slice(0, 10);
  }, [profile]);

  const loadProfile = async () => {
    try {
      const response = await api.get('/student/profile');
      setProfile(response.data);
      setPhone(response.data.phone || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    }
  };

  const loadRequests = async () => {
    try {
      const response = await api.get('/student/profile/requests');
      setRequests(response.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile requests.');
    }
  };

  const loadEnrollments = async () => {
    try {
      const response = await api.get('/student/dashboard');
      setEnrollments(response.data.enrollments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load enrollments.');
    }
  };

  useEffect(() => {
    loadProfile();
    loadRequests();
    loadEnrollments();
  }, []);

  const handlePhoneUpdate = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.put('/student/profile/phone', { phone });
      setMessage(response.data.message);
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  const handlePhotoUpdate = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!photo) {
      setError('Select a photo first.');
      return;
    }
    const payload = new FormData();
    payload.append('studentPhoto', photo);
    try {
      const response = await api.put('/student/profile/photo', payload);
      setMessage(response.data.message);
      setPhoto(null);
      loadProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Photo update failed.');
    }
  };

  const handleProfileUpdateRequest = async (event) => {
    event.preventDefault();
    if (!profile) return;
    setMessage('');
    setError('');

    const changes = {};
    const addChange = (key, oldValue, newValue) => {
      if (!newValue || newValue === oldValue) return;
      changes[key] = { old: oldValue || '', new: newValue };
    };

    addChange('firstName', profile.firstName, updateForm.firstName);
    addChange('middleName', profile.middleName, updateForm.middleName);
    addChange('lastName', profile.lastName, updateForm.lastName);
    addChange('dateOfBirth', currentDob, updateForm.dateOfBirth);
    addChange('fatherName', profile.fatherName, updateForm.fatherName);
    addChange('motherName', profile.motherName, updateForm.motherName);
    addChange('presentAddress', profile.presentAddress, updateForm.presentAddress);
    addChange('nid', profile.identityType === 'NID' ? profile.identityNumber : '', updateForm.nid);
    addChange('birthCert', profile.identityType === 'BIRTH_CERTIFICATE' ? profile.identityNumber : '', updateForm.birthCert);

    if (!Object.keys(changes).length) {
      setError('Provide at least one change for approval.');
      return;
    }
    if (!updateReason) {
      setError('Reason is required.');
      return;
    }

    const payload = new FormData();
    payload.append('changes', JSON.stringify(changes));
    payload.append('reason', updateReason);
    supportingDocs.forEach((file) => payload.append('supportingDocs', file));

    try {
      const response = await api.post('/student/profile/request-update', payload);
      setMessage(response.data.message);
      setUpdateForm({
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        fatherName: '',
        motherName: '',
        presentAddress: '',
        nid: '',
        birthCert: '',
      });
      setUpdateReason('');
      setSupportingDocs([]);
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.');
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.post('/student/change-password', passwordForm);
      setMessage(response.data.message);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Password update failed.');
    }
  };

  const handleIssueReport = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!issueForm.issueType || !issueForm.description) {
      setError('Issue type and description are required.');
      return;
    }
    if (issueForm.targetType === 'INSTITUTION' && !issueForm.institutionId) {
      setError('Select an institution to report this issue.');
      return;
    }

    const payload = new FormData();
    payload.append('issueType', issueForm.issueType);
    payload.append('description', issueForm.description);
    payload.append('targetType', issueForm.targetType);
    if (issueForm.targetType === 'INSTITUTION') {
      payload.append('institutionId', issueForm.institutionId);
    }
    issueFiles.forEach((file) => payload.append('attachments', file));

    try {
      const response = await api.post('/student/report-issue', payload);
      setMessage(`Issue reported. Ticket: ${response.data.ticketNumber}`);
      setIssueForm({ issueType: issueTypes[0], description: '', targetType: 'ADMIN', institutionId: '' });
      setIssueFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Issue report failed.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">My Profile</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {message && <p className="mt-2 text-sm text-success">{message}</p>}

      {profile && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="text-lg font-display font-semibold">Personal Details</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Name: {profile.firstName} {profile.middleName} {profile.lastName}</p>
              <p>Email: {profile.email}</p>
              <p>Date of Birth: {new Date(profile.dateOfBirth).toLocaleDateString()}</p>
              <p>Identity Type: {profile.identityType}</p>
              <p>Identity Number: {profile.identityNumber}</p>
              <p>Phone: {profile.phone}</p>
              <p>Address: {profile.presentAddress}</p>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-display font-semibold">Update Contact</h3>
            <form onSubmit={handlePhoneUpdate} className="mt-4 space-y-3">
              <input
                type="text"
                className="input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone"
              />
              <Button type="submit">Update Phone</Button>
            </form>

            <form onSubmit={handlePhotoUpdate} className="mt-6 space-y-3">
              <label className="block text-xs font-semibold text-slate-600">Update Photo</label>
              <input type="file" onChange={(event) => setPhoto(event.target.files[0])} />
              <Button type="submit" variant="secondary">Update Photo</Button>
            </form>
          </Card>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-display font-semibold">Request Profile Update</h3>
          <form onSubmit={handleProfileUpdateRequest} className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" placeholder="New first name" value={updateForm.firstName} onChange={(event) => setUpdateForm((prev) => ({ ...prev, firstName: event.target.value }))} />
              <input className="input" placeholder="New middle name" value={updateForm.middleName} onChange={(event) => setUpdateForm((prev) => ({ ...prev, middleName: event.target.value }))} />
              <input className="input" placeholder="New last name" value={updateForm.lastName} onChange={(event) => setUpdateForm((prev) => ({ ...prev, lastName: event.target.value }))} />
              <input className="input" type="date" value={updateForm.dateOfBirth} onChange={(event) => setUpdateForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} />
              <input className="input" placeholder="New father's name" value={updateForm.fatherName} onChange={(event) => setUpdateForm((prev) => ({ ...prev, fatherName: event.target.value }))} />
              <input className="input" placeholder="New mother's name" value={updateForm.motherName} onChange={(event) => setUpdateForm((prev) => ({ ...prev, motherName: event.target.value }))} />
            </div>
            <input className="input" placeholder="New address" value={updateForm.presentAddress} onChange={(event) => setUpdateForm((prev) => ({ ...prev, presentAddress: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" placeholder="New NID (optional)" value={updateForm.nid} onChange={(event) => setUpdateForm((prev) => ({ ...prev, nid: event.target.value }))} />
              <input className="input" placeholder="New Birth Certificate (optional)" value={updateForm.birthCert} onChange={(event) => setUpdateForm((prev) => ({ ...prev, birthCert: event.target.value }))} />
            </div>
            <textarea className="input" rows="3" placeholder="Reason for update" value={updateReason} onChange={(event) => setUpdateReason(event.target.value)} />
            <div>
              <label className="block text-xs font-semibold text-slate-600">Supporting documents (up to 3 files)</label>
              <input type="file" multiple onChange={(event) => setSupportingDocs(Array.from(event.target.files || []))} />
            </div>
            <Button type="submit">Submit Update Request</Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-lg font-display font-semibold">Update Requests</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {requests.length ? (
              requests.map((req) => (
                <div key={req.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-700">{req.status}</p>
                    <p className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Reason: {req.reason}</p>
                  {req.adminComments && <p className="text-xs text-slate-500">Admin: {req.adminComments}</p>}
                </div>
              ))
            ) : (
              <p>No profile update requests yet.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-display font-semibold">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
            <input
              className="input"
              type="password"
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            />
            <input
              className="input"
              type="password"
              placeholder="New password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            />
            <Button type="submit">Update Password</Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-lg font-display font-semibold">Report an Issue</h3>
          <form onSubmit={handleIssueReport} className="mt-4 space-y-3">
            <select
              className="input"
              value={issueForm.targetType}
              onChange={(event) =>
                setIssueForm((prev) => ({
                  ...prev,
                  targetType: event.target.value,
                  institutionId: event.target.value === 'INSTITUTION' ? prev.institutionId : '',
                }))
              }
            >
              <option value="ADMIN">Report to Admin</option>
              <option value="INSTITUTION">Report to Institution</option>
            </select>
            {issueForm.targetType === 'INSTITUTION' && (
              <select
                className="input"
                value={issueForm.institutionId}
                onChange={(event) => setIssueForm((prev) => ({ ...prev, institutionId: event.target.value }))}
              >
                <option value="">Select institution</option>
                {enrollments.map((enrollment) => (
                  <option key={enrollment.institution?.id} value={enrollment.institution?.id}>
                    {enrollment.institution?.name}
                  </option>
                ))}
              </select>
            )}
            <select
              className="input"
              value={issueForm.issueType}
              onChange={(event) => setIssueForm((prev) => ({ ...prev, issueType: event.target.value }))}
            >
              {issueTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <textarea
              className="input"
              rows="4"
              placeholder="Describe the issue"
              value={issueForm.description}
              onChange={(event) => setIssueForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-600">Attachments (optional)</label>
              <input type="file" multiple onChange={(event) => setIssueFiles(Array.from(event.target.files || []))} />
            </div>
            <Button type="submit">Submit Report</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
