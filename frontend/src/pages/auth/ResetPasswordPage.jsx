import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import api from '../../services/api.js';

export default function ResetPasswordPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialToken = params.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/reset-password', { token, password });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed.');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl justify-center px-6 py-12">
      <Card className="w-full max-w-lg">
        <h1 className="text-2xl font-display font-semibold">Set a new password</h1>
        <p className="mt-2 text-sm text-slate-600">Use the token from your reset email.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            className="input"
            placeholder="Reset token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
          />
          <input
            type="password"
            className="input"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {message && <p className="text-sm text-success">{message}</p>}
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full">
            Reset Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
