import React, { useEffect, useState } from 'react';
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

export default function InstitutionProfile() {
  const [profile, setProfile] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [issueForm, setIssueForm] = useState({ issueType: issueTypes[0], description: '' });
  const [issueFiles, setIssueFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = async () => {
    try {
      const response = await api.get('/institution/profile');
      setProfile(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.post('/institution/change-password', passwordForm);
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

    const payload = new FormData();
    payload.append('issueType', issueForm.issueType);
    payload.append('description', issueForm.description);
    issueFiles.forEach((file) => payload.append('attachments', file));

    try {
      const response = await api.post('/institution/report-issue', payload);
      setMessage(`Issue reported. Ticket: ${response.data.ticketNumber}`);
      setIssueForm({ issueType: issueTypes[0], description: '' });
      setIssueFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Issue report failed.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Institution Profile</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {message && <p className="mt-2 text-sm text-success">{message}</p>}

      {profile && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <h3 className="text-lg font-display font-semibold">Institution Details</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Name: {profile.name}</p>
              <p>Email: {profile.email}</p>
              <p>Type: {profile.type}</p>
              <p>Phone: {profile.phone}</p>
              <p>Address: {profile.address}</p>
              {profile.eiin && <p>EIIN: {profile.eiin}</p>}
              {profile.registrationNumber && <p>Registration Number: {profile.registrationNumber}</p>}
              {profile.board && <p>Board: {profile.board}</p>}
              <p>Authority: {profile.authorityName} ({profile.authorityTitle})</p>
              <p>Certificate Permission: {profile.canIssueCertificates ? 'Active' : 'Revoked'}</p>
            </div>
          </Card>

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
        </div>
      )}

      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-display font-semibold">Report an Issue</h3>
          <form onSubmit={handleIssueReport} className="mt-4 space-y-3">
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
