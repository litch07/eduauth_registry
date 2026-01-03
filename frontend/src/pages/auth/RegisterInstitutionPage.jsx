import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import api from '../../services/api.js';

const institutionTypes = [
  'HIGH_SCHOOL',
  'COLLEGE',
  'TECHNICAL',
  'MADRASAH',
  'UNIVERSITY',
  'TRAINING_CENTRE',
];

const boards = ['COMILLA', 'DHAKA', 'DINAJPUR', 'JESSORE', 'MYMENSINGH', 'RAJSHAHI', 'SYLHET', 'MADRASAH', 'TECHNICAL'];

export default function RegisterInstitutionPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'UNIVERSITY',
    eiin: '',
    registrationNumber: '',
    board: '',
    authorityName: '',
    password: '',
    confirmPassword: '',
  });
  const [signature, setSignature] = useState(null);
  const [status, setStatus] = useState({ message: '', error: '' });
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => {
    const value = form.password || '';
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    if (!value) return '';
    if (score >= 4) return 'Strong';
    if (score >= 3) return 'Medium';
    return 'Weak';
  }, [form.password]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ message: '', error: '' });

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (signature) payload.append('authoritySignature', signature);

    try {
      setLoading(true);
      const response = await api.post('/auth/register/institution', payload);
      setStatus({ message: response.data.message, error: '' });
    } catch (err) {
      setStatus({ message: '', error: err.response?.data?.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <Card>
        <h1 className="text-2xl font-display font-semibold">Institution Registration</h1>
        <p className="mt-2 text-sm text-slate-600">Register your institution for EduAuth Registry.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="input" name="name" placeholder="Institution name" value={form.name} onChange={handleChange} required />
          <input className="input" name="email" placeholder="Institution email" value={form.email} onChange={handleChange} required />
          <input className="input" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
          <input className="input" name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
          <select className="input" name="type" value={form.type} onChange={handleChange}>
            {institutionTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select className="input" name="board" value={form.board} onChange={handleChange}>
            <option value="">Select board (if applicable)</option>
            {boards.map((board) => (
              <option key={board} value={board}>
                {board}
              </option>
            ))}
          </select>
          <input className="input" name="eiin" placeholder="EIIN (if applicable)" value={form.eiin} onChange={handleChange} />
          <input className="input" name="registrationNumber" placeholder="Registration Number" value={form.registrationNumber} onChange={handleChange} />
          <input className="input" name="authorityName" placeholder="Authority name" value={form.authorityName} onChange={handleChange} required />
          <input className="input" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          {passwordStrength && (
            <p className="text-xs text-slate-500 md:col-span-2">Password strength: {passwordStrength}</p>
          )}
          <input className="input" name="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} required />
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600">Authority Signature (JPEG/PNG)</label>
            <input type="file" onChange={(event) => setSignature(event.target.files[0])} required />
          </div>
          {status.error && <p className="text-sm text-error md:col-span-2">{status.error}</p>}
          {status.message && <p className="text-sm text-success md:col-span-2">{status.message}</p>}
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Register Institution'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-primary">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
