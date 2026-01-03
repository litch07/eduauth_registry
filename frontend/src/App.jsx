import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

import LandingPage from './pages/public/LandingPage.jsx';
import VerificationPage from './pages/public/VerificationPage.jsx';

import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterStudentPage from './pages/auth/RegisterStudentPage.jsx';
import RegisterInstitutionPage from './pages/auth/RegisterInstitutionPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';

import StudentDashboard from './pages/student/StudentDashboard.jsx';
import StudentProfile from './pages/student/StudentProfile.jsx';
import StudentCertificates from './pages/student/StudentCertificates.jsx';
import StudentEnrollmentRequests from './pages/student/StudentEnrollmentRequests.jsx';

import InstitutionDashboard from './pages/institution/InstitutionDashboard.jsx';
import InstitutionProfile from './pages/institution/InstitutionProfile.jsx';
import EnrollStudentPage from './pages/institution/EnrollStudentPage.jsx';
import InstitutionStudentsPage from './pages/institution/InstitutionStudentsPage.jsx';
import IssueCertificatePage from './pages/institution/IssueCertificatePage.jsx';
import InstitutionProgramsPage from './pages/institution/InstitutionProgramsPage.jsx';
import InstitutionEnrollmentRequests from './pages/institution/InstitutionEnrollmentRequests.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminApprovalsPage from './pages/admin/AdminApprovalsPage.jsx';
import AdminInstitutionsPage from './pages/admin/AdminInstitutionsPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminActivityLogsPage from './pages/admin/AdminActivityLogsPage.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/verify" element={<VerificationPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/student" element={<RegisterStudentPage />} />
          <Route path="/register/institution" element={<RegisterInstitutionPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute roles={['STUDENT']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificates"
            element={
              <ProtectedRoute roles={['STUDENT']}>
                <StudentCertificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/enrollment-requests"
            element={
              <ProtectedRoute roles={['STUDENT']}>
                <StudentEnrollmentRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/institution"
            element={
              <ProtectedRoute roles={['INSTITUTION']}>
                <InstitutionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/profile"
            element={
              <ProtectedRoute roles={['INSTITUTION']}>
                <InstitutionProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/enroll"
            element={
              <ProtectedRoute roles={['INSTITUTION']}>
                <EnrollStudentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/students"
            element={
              <ProtectedRoute roles={['INSTITUTION']}>
                <InstitutionStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/certificates"
            element={
              <ProtectedRoute roles={['INSTITUTION']}>
                <IssueCertificatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/programs"
            element={
              <ProtectedRoute roles={['INSTITUTION']}>
                <InstitutionProgramsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/enrollment-requests"
            element={
              <ProtectedRoute roles={['INSTITUTION']}>
                <InstitutionEnrollmentRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/institutions"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminInstitutionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminActivityLogsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
