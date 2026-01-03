import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  const loadReports = () => {
    api
      .get('/admin/reports')
      .then((response) => setReports(response.data.reports || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reports.'));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      loadReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  const respond = async (id) => {
    const response = window.prompt('Enter response to reporter:');
    if (!response) return;
    try {
      await api.post(`/admin/reports/${id}/respond`, { response });
      loadReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Response failed.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Issue Reports</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      <div className="mt-6 space-y-3">
        {reports.length ? (
          reports.map((report) => (
            <Card key={report.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{report.ticketNumber}</p>
                <span className="text-xs text-slate-500">{report.status}</span>
              </div>
              <p className="text-xs text-slate-500">{report.reporterName} - {report.reporterEmail}</p>
              <p className="text-xs text-slate-500">Type: {report.issueType}</p>
              <p className="text-sm text-slate-600">{report.description}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => updateStatus(report.id, 'IN_PROGRESS')}>In Progress</Button>
                <Button variant="ghost" onClick={() => updateStatus(report.id, 'RESOLVED')}>Resolve</Button>
                <Button variant="ghost" onClick={() => respond(report.id)}>Respond</Button>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-slate-600">No reports yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
