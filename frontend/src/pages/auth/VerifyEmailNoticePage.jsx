import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function VerifyEmailNoticePage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [status, setStatus] = useState({ message: '', error: '' });
  const [loading, setLoading] = useState(false);

  const resendVerification = async () => {
    setStatus({ message: '', error: '' });
    if (!email) {
      setStatus({ message: '', error: 'Enter your email to resend verification.' });
      return;
    }
    try {
      setLoading(true);
      const response = await api.post('/auth/resend-verification', { email });
      setStatus({ message: response.data.message, error: '' });
    } catch (err) {
      setStatus({ message: '', error: err.response?.data?.message || 'Resend failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl justify-center px-6 py-12">
      <Card className="w-full max-w-xl">
        <h1 className="text-2xl font-display font-semibold">Verify Your Email</h1>
        <p className="mt-3 text-sm text-slate-600">
          Registration submitted successfully. Check your email to verify your account.
          After verification, an admin will review your registration.
        </p>

        <div className="mt-6 space-y-3">
          <label className="block text-xs font-semibold text-slate-600">Resend verification email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
          />
          {status.error && <p className="text-sm text-error">{status.error}</p>}
          {status.message && <p className="text-sm text-success">{status.message}</p>}
          <Button type="button" onClick={resendVerification} disabled={loading}>
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        </div>

        <div className="mt-6 text-sm text-slate-600">
          Ready to sign in? <Link to="/login" className="text-primary">Go to login</Link>
        </div>
      </Card>
    </div>
  );
}
