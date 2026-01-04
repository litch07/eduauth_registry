import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      setLoading(true);
      try {
        const response = await api.post('/auth/login', form);
        login(response.data.token, response.data.user);
        const role = response.data.user.role;
        navigate(role === 'STUDENT' ? '/student' : '/institution');
        return;
      } catch (err) {
        if (err.response?.status !== 401) {
          setError(err.response?.data?.message || 'Login failed.');
          return;
        }
      }

      const adminResponse = await api.post('/admin/login', form);
      login(adminResponse.data.token, { ...adminResponse.data.admin, role: 'ADMIN' });
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg">
        <h1 className="text-2xl font-display font-semibold">Sign in to EduAuth</h1>
        <p className="mt-2 text-sm text-slate-600">Access your dashboard and manage credentials.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email address"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
            required
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
            required
          />
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Admins can sign in here too.</span>
            <Link to="/forgot-password" className="text-primary hover:text-primary-hover">
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-sm text-slate-600">
          <p>
            Need an account?{' '}
            <Link to="/register/student" className="text-primary hover:text-primary-hover">
              Student registration
            </Link>
            {' | '}
            <Link to="/register/institution" className="text-primary hover:text-primary-hover">
              Institution registration
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
