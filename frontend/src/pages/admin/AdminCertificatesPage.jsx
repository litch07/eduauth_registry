import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [filters, setFilters] = useState({
    serial: '',
    rollNumber: '',
    student: '',
    institution: '',
  });
  const [error, setError] = useState('');
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const loadCertificates = async () => {
    try {
      setError('');
      const response = await api.get('/admin/certificates', {
        params: {
          serial: filters.serial || undefined,
          rollNumber: filters.rollNumber || undefined,
          student: filters.student || undefined,
          institution: filters.institution || undefined,
        },
      });
      setCertificates(response.data.certificates || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load certificates.');
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Certificates</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      <Card className="mt-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            className="input"
            placeholder="Serial"
            value={filters.serial}
            onChange={(event) => setFilters((prev) => ({ ...prev, serial: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Roll number"
            value={filters.rollNumber}
            onChange={(event) => setFilters((prev) => ({ ...prev, rollNumber: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Student name, ID, or email"
            value={filters.student}
            onChange={(event) => setFilters((prev) => ({ ...prev, student: event.target.value }))}
          />
          <input
            className="input"
            placeholder="Institution name, EIIN, or reg."
            value={filters.institution}
            onChange={(event) => setFilters((prev) => ({ ...prev, institution: event.target.value }))}
          />
        </div>
        <div className="mt-4">
          <Button type="button" onClick={loadCertificates}>
            Search
          </Button>
        </div>
      </Card>

      <div className="mt-6 space-y-4">
        {certificates.length ? (
          certificates.map((cert) => (
            <Card key={cert.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{cert.certificateType}</p>
                  <p className="text-xs text-slate-500">
                    Serial: {cert.serial} | Roll: {cert.rollNumber || '-'}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(cert.issueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                <p>
                  Student: {cert.student?.firstName} {cert.student?.lastName} ({cert.student?.studentId})
                </p>
                <p>Student Email: {cert.student?.email}</p>
                <p>Institution: {cert.institution?.name}</p>
                <p>Institution Type: {cert.institution?.type}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-500">
                  Public: {cert.isPubliclyShareable ? 'Yes' : 'No'}
                </span>
                {cert.pdfPath && (
                  <a
                    className="text-primary hover:text-primary-hover"
                    href={`${backendUrl}${cert.pdfPath}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View PDF
                  </a>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-slate-600">No certificates found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
