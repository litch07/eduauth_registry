import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [qrState, setQrState] = useState({ open: false, serial: '', image: '' });
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const loadCertificates = () => {
    api
      .get('/student/certificates')
      .then((response) => setCertificates(response.data.certificates || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load certificates.'));
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const copySerial = async (serial) => {
    try {
      await navigator.clipboard.writeText(serial);
      setMessage('Serial copied to clipboard.');
    } catch (err) {
      setError('Unable to copy serial.');
    }
  };

  const showQr = async (certificate) => {
    if (!certificate.qrCodeData) {
      setError('QR data not available for this certificate.');
      return;
    }
    try {
      const image = await QRCode.toDataURL(certificate.qrCodeData, { margin: 1, width: 240 });
      setQrState({ open: true, serial: certificate.serial, image });
    } catch (err) {
      setError('Failed to generate QR code.');
    }
  };

  const toggleSharing = async (certificate) => {
    try {
      await api.put(`/student/certificates/${certificate.id}/sharing`, {
        isPubliclyShareable: !certificate.isPubliclyShareable,
      });
      loadCertificates();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">My Certificates</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {message && <p className="mt-2 text-sm text-success">{message}</p>}

      <div className="mt-6 space-y-4">
        {certificates.length ? (
          certificates.map((cert) => (
            <Card key={cert.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-display font-semibold">{cert.certificateType}</h3>
                <p className="text-sm text-slate-600">Serial: {cert.serial}</p>
                <p className="text-sm text-slate-600">Institution: {cert.institution?.name}</p>
                <p className="text-xs text-slate-500">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost" onClick={() => copySerial(cert.serial)}>
                  Copy Serial
                </Button>
                <Button variant="secondary" onClick={() => showQr(cert)}>
                  View QR
                </Button>
                {cert.pdfPath && (
                  <a
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-primary"
                    href={`${backendUrl}${cert.pdfPath}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download PDF
                  </a>
                )}
                <Button variant="ghost" onClick={() => toggleSharing(cert)}>
                  {cert.isPubliclyShareable ? 'Disable Sharing' : 'Enable Sharing'}
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-slate-600">No certificates issued yet.</p>
          </Card>
        )}
      </div>

      {qrState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-soft">
            <h3 className="text-lg font-display font-semibold">QR Code</h3>
            <p className="mt-1 text-xs text-slate-500">Serial: {qrState.serial}</p>
            <img src={qrState.image} alt="Certificate QR code" className="mx-auto my-4 h-48 w-48" />
            <Button type="button" onClick={() => setQrState({ open: false, serial: '', image: '' })}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
