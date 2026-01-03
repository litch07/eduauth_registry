import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import api from '../../services/api.js';

const certificateTypes = [
  'JSC',
  'SSC',
  'VOCATIONAL_SSC',
  'HSC',
  'VOCATIONAL_HSC',
  'BM',
  'JDC',
  'DAKHIL',
  'ALIM',
  'VOCATIONAL_MADRASAH',
  'DIPLOMA',
  'BSC',
  'MSC',
  'BA',
  'MA',
  'BBA',
  'MBA',
  'LLB',
  'LLM',
  'MBBS',
  'BDS',
  'TRAINING_COMPLETION',
  'SKILL_CERTIFICATE',
];

const boards = ['COMILLA', 'DHAKA', 'DINAJPUR', 'JESSORE', 'MYMENSINGH', 'RAJSHAHI', 'SYLHET', 'MADRASAH', 'TECHNICAL'];

export default function IssueCertificatePage() {
  const [students, setStudents] = useState([]);
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const [form, setForm] = useState({
    studentId: '',
    certificateType: '',
    rollNumber: '',
    registrationNumber: '',
    examinationYear: '',
    board: '',
    group: '',
    gpa: '',
    passingYear: '',
    diplomaSubject: '',
    duration: '',
    session: '',
    program: '',
    department: '',
    major: '',
    cgpa: '',
    degreeClass: '',
    convocationDate: '',
    completionDate: '',
    skillName: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadIssued = () => {
    api
      .get('/institution/certificates')
      .then((response) => setIssuedCertificates(response.data.certificates || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load issued certificates.'));
  };

  useEffect(() => {
    api
      .get('/institution/students')
      .then((response) => setStudents(response.data.enrollments || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load students.'));
    loadIssued();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.post('/institution/certificates/issue', form);
      setMessage('Certificate issued successfully.');
      setForm({
        studentId: '',
        certificateType: '',
        rollNumber: '',
        registrationNumber: '',
        examinationYear: '',
        board: '',
        group: '',
        gpa: '',
        passingYear: '',
        diplomaSubject: '',
        duration: '',
        session: '',
        program: '',
        department: '',
        major: '',
        cgpa: '',
        degreeClass: '',
        convocationDate: '',
        completionDate: '',
        skillName: '',
      });
      loadIssued();
    } catch (err) {
      setError(err.response?.data?.message || 'Issue failed.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-display font-semibold">Issue Certificate</h1>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {message && <p className="mt-2 text-sm text-success">{message}</p>}

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <select name="studentId" className="input" value={form.studentId} onChange={handleChange} required>
            <option value="">Select student</option>
            {students.map((enrollment) => (
              <option key={enrollment.student?.id} value={enrollment.student?.id}>
                {enrollment.student?.firstName} {enrollment.student?.lastName} ({enrollment.studentInstitutionId})
              </option>
            ))}
          </select>
          <select name="certificateType" className="input" value={form.certificateType} onChange={handleChange} required>
            <option value="">Select certificate type</option>
            {certificateTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input className="input" name="rollNumber" placeholder="Roll number" value={form.rollNumber} onChange={handleChange} />
          <input className="input" name="registrationNumber" placeholder="Registration number" value={form.registrationNumber} onChange={handleChange} />
          <input className="input" name="examinationYear" placeholder="Examination year" value={form.examinationYear} onChange={handleChange} />
          <select className="input" name="board" value={form.board} onChange={handleChange}>
            <option value="">Select board (if applicable)</option>
            {boards.map((board) => (
              <option key={board} value={board}>
                {board}
              </option>
            ))}
          </select>
          <input className="input" name="group" placeholder="Group (Science/Arts/Commerce)" value={form.group} onChange={handleChange} />
          <input className="input" name="gpa" placeholder="GPA" value={form.gpa} onChange={handleChange} />
          <input className="input" name="passingYear" placeholder="Passing year" value={form.passingYear} onChange={handleChange} />
          <input className="input" name="diplomaSubject" placeholder="Diploma subject" value={form.diplomaSubject} onChange={handleChange} />
          <input className="input" name="duration" placeholder="Duration" value={form.duration} onChange={handleChange} />
          <input className="input" name="session" placeholder="Session" value={form.session} onChange={handleChange} />
          <input className="input" name="program" placeholder="Program" value={form.program} onChange={handleChange} />
          <input className="input" name="department" placeholder="Department" value={form.department} onChange={handleChange} />
          <input className="input" name="major" placeholder="Major" value={form.major} onChange={handleChange} />
          <input className="input" name="cgpa" placeholder="CGPA" value={form.cgpa} onChange={handleChange} />
          <input className="input" name="degreeClass" placeholder="Degree class" value={form.degreeClass} onChange={handleChange} />
          <input className="input" type="date" name="convocationDate" value={form.convocationDate} onChange={handleChange} />
          <input className="input" type="date" name="completionDate" value={form.completionDate} onChange={handleChange} />
          <input className="input" name="skillName" placeholder="Skill name" value={form.skillName} onChange={handleChange} />
          <div className="md:col-span-2">
            <Button type="submit">Issue Certificate</Button>
          </div>
        </form>
      </Card>

      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-display font-semibold">Issued Certificates</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {issuedCertificates.length ? (
              issuedCertificates.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between border-b border-slate-100 py-2">
                  <div>
                    <p className="font-semibold text-slate-700">{cert.certificateType}</p>
                    <p className="text-xs text-slate-500">Serial: {cert.serial}</p>
                    {cert.pdfPath && (
                      <a
                        className="text-xs font-semibold text-primary hover:text-primary-hover"
                        href={`${backendUrl}${cert.pdfPath}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download PDF
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(cert.issueDate).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p>No certificates issued yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
