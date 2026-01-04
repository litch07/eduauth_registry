import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import api from '../../services/api.js';

export default function VerifyEmailPage() {
  const location = useLocation();
  const [status, setStatus] = useState({ message: 'Verifying...', error: '' });
  const lastTokenRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      setStatus({ message: '', error: 'Verification token missing.' });
      return;
    }

    if (lastTokenRef.current === token) {
      return;
    }
    lastTokenRef.current = token;

    api
      .get(`/auth/verify-email?token=${token}`)
      .then((response) => setStatus({ message: response.data.message, error: '' }))
      .catch((err) => setStatus({ message: '', error: err.response?.data?.message || 'Verification failed.' }));
  }, [location.search]);

  return (
    <div className="mx-auto flex w-full max-w-3xl justify-center px-6 py-12">
      <Card className="w-full max-w-lg">
        <h1 className="text-2xl font-display font-semibold">Email Verification</h1>
        {status.message && <p className="mt-4 text-sm text-success">{status.message}</p>}
        {status.error && <p className="mt-4 text-sm text-error">{status.error}</p>}
        <div className="mt-6 text-sm text-slate-600">
          <Link to="/login" className="text-primary">Go to login</Link>
        </div>
      </Card>
    </div>
  );
}
