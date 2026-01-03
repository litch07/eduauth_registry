import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import api from '../../services/api.js';

export default function InstitutionStudentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/institution/students')
      .then((response) => setEnrollments(response.data.enrollments || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load students.'));
  }, []);

  const loadDetails = async (studentId) => {
    try {
      const response = await api.get(`/institution/students/${studentId}`);
      setSelected(studentId);
      setDetails(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load student details.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">My Students</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      <div className="mt-6 space-y-3">
        {enrollments.length ? (
          enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {enrollment.student?.firstName} {enrollment.student?.lastName}
                </p>
                <p className="text-xs text-slate-500">ID: {enrollment.studentInstitutionId}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:text-primary-hover"
                  onClick={() => loadDetails(enrollment.student?.id)}
                >
                  View Details
                </button>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-slate-600">No enrolled students yet.</p>
          </Card>
        )}
      </div>

      {selected && details && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold">Student Details</h3>
              <button
                type="button"
                className="text-sm font-semibold text-slate-500"
                onClick={() => {
                  setSelected(null);
                  setDetails(null);
                }}
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Name: {details.enrollment?.student?.firstName} {details.enrollment?.student?.lastName}</p>
              <p>Student ID: {details.enrollment?.student?.studentId}</p>
              <p>Phone: {details.enrollment?.student?.phone}</p>
              <p>Address: {details.enrollment?.student?.presentAddress}</p>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-700">Certificates</h4>
              <div className="mt-2 space-y-2 text-xs text-slate-500">
                {details.certificates?.length ? (
                  details.certificates.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between">
                      <span>{cert.certificateType}</span>
                      <span>{cert.serial}</span>
                    </div>
                  ))
                ) : (
                  <p>No certificates issued yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
