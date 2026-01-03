import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import api from '../../services/api.js';

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/activity-logs')
      .then((response) => setLogs(response.data.logs || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load activity logs.'));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const term = search.toLowerCase();
    return logs.filter((log) =>
      [log.actorName, log.actorType, log.action, log.targetType].some((value) =>
        String(value || '').toLowerCase().includes(term)
      )
    );
  }, [logs, search]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Activity Logs</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      <div className="mt-4">
        <input
          className="input"
          placeholder="Search by actor, action, or target"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length ? (
          filtered.map((log) => (
            <Card key={log.id} className="flex flex-col gap-1 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">{log.action}</span>
                <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <span className="text-xs text-slate-500">Actor: {log.actorName} ({log.actorType})</span>
              {log.targetType && <span className="text-xs text-slate-500">Target: {log.targetType}</span>}
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-slate-600">No activity logs found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
