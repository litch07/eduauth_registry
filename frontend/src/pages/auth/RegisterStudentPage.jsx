import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import api from '../../services/api.js';

export default function RegisterStudentPage() {
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    identityType: 'NID',
    nid: '',
    birthCert: '',
    fatherName: '',
    motherName: '',
    email: '',
    phone: '',
    presentAddress: '',
    password: '',
    confirmPassword: '',
  });
  const [files, setFiles] = useState({ nidOrBirthCertImage: null, studentPhoto: null });
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

  const handleFileChange = (event) => {
    const { name, files: selected } = event.target;
    setFiles((prev) => ({ ...prev, [name]: selected[0] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ message: '', error: '' });

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (files.nidOrBirthCertImage) payload.append('nidOrBirthCertImage', files.nidOrBirthCertImage);
    if (files.studentPhoto) payload.append('studentPhoto', files.studentPhoto);

    try {
      setLoading(true);
      const response = await api.post('/auth/register/student', payload);
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
        <h1 className="text-2xl font-display font-semibold">Student Registration</h1>
        <p className="mt-2 text-sm text-slate-600">Create your EduAuth Registry account.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="input" name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} required />
          <input className="input" name="middleName" placeholder="Middle name (optional)" value={form.middleName} onChange={handleChange} />
          <input className="input" name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} required />
          <input className="input" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} required />
          <select className="input" name="identityType" value={form.identityType} onChange={handleChange}>
            <option value="NID">NID</option>
            <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
          </select>
          <input className="input" name="nid" placeholder="NID (10/13 digits)" value={form.nid} onChange={handleChange} />
          <input className="input" name="birthCert" placeholder="Birth Certificate (17 digits)" value={form.birthCert} onChange={handleChange} />
          <input className="input" name="fatherName" placeholder="Father's name" value={form.fatherName} onChange={handleChange} required />
          <input className="input" name="motherName" placeholder="Mother's name" value={form.motherName} onChange={handleChange} required />
          <input className="input" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className="input" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
          <input className="input md:col-span-2" name="presentAddress" placeholder="Present address" value={form.presentAddress} onChange={handleChange} required />
          <input className="input" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          {passwordStrength && (
            <p className="text-xs text-slate-500 md:col-span-2">Password strength: {passwordStrength}</p>
          )}
          <input className="input" name="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={handleChange} required />
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600">Identity Document (JPEG/PNG)</label>
            <input name="nidOrBirthCertImage" type="file" onChange={handleFileChange} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600">Student Photo (JPEG/PNG)</label>
            <input name="studentPhoto" type="file" onChange={handleFileChange} required />
          </div>
          {status.error && <p className="text-sm text-error md:col-span-2">{status.error}</p>}
          {status.message && <p className="text-sm text-success md:col-span-2">{status.message}</p>}
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Submitting...' : 'Register'}
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
