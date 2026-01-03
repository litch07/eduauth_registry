import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function InstitutionProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({ programName: '', programType: '', description: '' });
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadPrograms = () => {
    api
      .get('/institution/programs')
      .then((response) => setPrograms(response.data.programs || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load programs.'));
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      supportingDocs.forEach((file) => payload.append('supportingDocs', file));
      await api.post('/institution/programs/request', payload);
      setMessage('Program request submitted.');
      setForm({ programName: '', programType: '', description: '' });
      setSupportingDocs([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Programs</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {message && <p className="mt-2 text-sm text-success">{message}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-display font-semibold">Approved Programs</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {programs.length ? (
              programs.map((program) => (
                <li key={program.id} className="border-b border-slate-100 py-2">
                  <p className="font-semibold text-slate-700">{program.programName}</p>
                  <p className="text-xs text-slate-500">{program.programType}</p>
                  {program.description && <p className="text-xs text-slate-500">{program.description}</p>}
                </li>
              ))
            ) : (
              <li>No programs approved yet.</li>
            )}
          </ul>
        </Card>

        <Card>
          <h3 className="text-lg font-display font-semibold">Request New Program</h3>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <input className="input" name="programName" placeholder="Program name" value={form.programName} onChange={(event) => setForm((prev) => ({ ...prev, programName: event.target.value }))} required />
            <select className="input" name="programType" value={form.programType} onChange={(event) => setForm((prev) => ({ ...prev, programType: event.target.value }))} required>
              <option value="">Select program type</option>
              <option value="degree">degree</option>
              <option value="training">training</option>
              <option value="skill">skill</option>
            </select>
            <textarea className="input" rows="4" name="description" placeholder="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} required />
            <div>
              <label className="block text-xs font-semibold text-slate-600">Supporting documents (optional)</label>
              <input type="file" multiple onChange={(event) => setSupportingDocs(Array.from(event.target.files || []))} />
            </div>
            <Button type="submit">Submit Request</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
