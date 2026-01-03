import React, { useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import api from '../../services/api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl justify-center px-6 py-12">
      <Card className="w-full max-w-lg">
        <h1 className="text-2xl font-display font-semibold">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-600">We will email a password reset link.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            className="input"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {message && <p className="text-sm text-success">{message}</p>}
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      </Card>
    </div>
  );
}
