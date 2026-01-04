import React, { useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import api from '../../services/api.js';

export default function VerificationPage() {
  const [serial, setSerial] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);

    if (!serial.trim() || !rollNumber.trim()) {
      setError('Enter both the serial number and roll number to verify.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/verify/certificate', {
        serial: serial.trim(),
        rollNumber: rollNumber.trim(),
      });
      setResult(response.data.certificate);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('This certificate is not available for public verification per the holder\'s privacy settings.');
      } else if (err.response?.status === 404) {
        setError('Certificate not found. Please check the serial and try again.');
      } else {
        setError(err.response?.data?.message || 'Verification failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyQrInput = () => {
    if (!qrInput.trim()) return;
    try {
      const url = new URL(qrInput.trim());
      const serialParam = url.searchParams.get('serial');
      const rollParam = url.searchParams.get('roll');
      if (serialParam) {
        setSerial(serialParam.toUpperCase());
        if (rollParam) {
          setRollNumber(rollParam.toUpperCase());
        }
        setQrInput('');
        return;
      }
    } catch (error) {
      // Not a URL, fall through
    }
    setSerial(qrInput.trim().toUpperCase());
    setQrInput('');
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-3xl font-display font-semibold">Verify a Certificate</h1>
          <p className="text-sm text-slate-600">
            Enter the certificate serial and roll number, or scan the QR code from the certificate PDF.
            Verification results appear instantly.
          </p>
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              value={serial}
              onChange={(event) => setSerial(event.target.value)}
              placeholder="Serial No. e.g., A7K9M3X"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="text"
              value={rollNumber}
              onChange={(event) => setRollNumber(event.target.value)}
              placeholder="Institution Roll Number"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Verify Certificate'}
            </Button>
          </form>
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Have a QR link? Paste it below to auto-fill the serial.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrInput}
                onChange={(event) => setQrInput(event.target.value)}
                placeholder="Paste QR verification link"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
              <Button type="button" variant="ghost" onClick={applyQrInput}>
                Use QR
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          {error && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSerial('');
                  setRollNumber('');
                  setError('');
                  setResult(null);
                }}
              >
                Try Again
              </Button>
              <a className="text-primary hover:text-primary-hover" href="mailto:support@eduauth.gov.bd">
                Report Issue
              </a>
            </div>
          )}
        </div>

        <Card className="min-h-[260px]">
          {result ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-success">Verified</p>
              <h2 className="text-xl font-display font-semibold">{result.studentName}</h2>
              <div className="text-sm text-slate-600">
                <p>Certificate: {result.certificateType}</p>
                <p>Serial: {result.serial}</p>
                <p>Roll: {result.rollNumber}</p>
                <p>Institution: {result.institutionName}</p>
                <p>Issued: {new Date(result.issueDate).toLocaleDateString()}</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                Print Verification
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-slate-500">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Awaiting verification</p>
              <p>Submit a serial number to view official verification details.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
