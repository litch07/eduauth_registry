import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState('');

  const loadData = () => {
    api
      .get('/admin/institutions')
      .then((response) => setInstitutions(response.data.institutions || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load institutions.'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const togglePermission = async (institution) => {
    try {
      if (institution.canIssueCertificates) {
        await api.put(`/admin/institutions/${institution.id}/revoke-permission`, { reason: 'Policy review in progress.' });
      } else {
        await api.put(`/admin/institutions/${institution.id}/grant-permission`);
      }
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  const revokeProgram = async (institutionId, programId) => {
    try {
      await api.put(`/admin/institutions/${institutionId}/programs/${programId}/revoke`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Program revoke failed.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Institutions</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      <div className="mt-6 space-y-3">
        {institutions.length ? (
          institutions.map((inst) => (
            <Card key={inst.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">{inst.name}</p>
                <p className="text-xs text-slate-500">{inst.user?.email}</p>
                {inst.programs?.length ? (
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    {inst.programs.map((program) => (
                      <div key={program.id} className="flex items-center justify-between">
                        <span>{program.programName}</span>
                        {program.isActive ? (
                          <button
                            type="button"
                            onClick={() => revokeProgram(inst.id, program.id)}
                            className="text-xs font-semibold text-error"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-slate-400">Inactive</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No programs listed.</p>
                )}
              </div>
              <Button variant={inst.canIssueCertificates ? 'ghost' : 'secondary'} onClick={() => togglePermission(inst)}>
                {inst.canIssueCertificates ? 'Revoke Permission' : 'Grant Permission'}
              </Button>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-slate-600">No institutions found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
