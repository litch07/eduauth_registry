import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';

export default function LandingPage() {
  return (
    <div className="bg-background">
      <section className="hero-bg text-white">
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-20 md:flex-row md:items-center">
          <div className="flex-1 space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Bangladesh Digital Trust Platform</p>
            <h1 className="text-4xl font-display font-semibold leading-tight md:text-5xl">
              Instant, tamper-proof academic credential verification.
            </h1>
            <p className="text-base text-white/80 md:text-lg">
              EduAuth Registry replaces paper-based verification with secure, cryptographic certificates.
              Institutions issue with confidence. Students prove achievements anywhere. Employers verify in seconds.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register/student">
                <Button className="bg-white text-primary hover:bg-slate-100">Student Register</Button>
              </Link>
              <Link to="/register/institution">
                <Button variant="secondary">Institution Register</Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/70">
              <span>Powered by SHA-256 integrity checks</span>
              <span className="h-1 w-1 rounded-full bg-white/60"></span>
              <span>QR verification built-in</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="card-surface bg-white/10 p-8 text-white backdrop-blur-sm">
              <h3 className="text-xl font-display font-semibold">Verification at a glance</h3>
              <div className="mt-6 space-y-4">
                {[
                  'Scan a QR or enter a serial to confirm authenticity',
                  'Track approvals for student and institution onboarding',
                  'Generate professional PDF certificates instantly',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-secondary"></span>
                    <p className="text-sm text-white/80">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/verify">
                  <Button variant="ghost" className="border-white/40 text-white hover:border-white">
                    Verify a certificate
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <h3 className="text-lg font-display font-semibold">Universities & Institutions</h3>
            <p className="mt-3 text-sm text-slate-600">
              Protect institutional reputation. Issue verifiable certificates with controlled permissions.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-display font-semibold">Students</h3>
            <p className="mt-3 text-sm text-slate-600">
              Own and share credentials securely. Toggle public sharing anytime.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-display font-semibold">Employers</h3>
            <p className="mt-3 text-sm text-slate-600">
              Verify in seconds. No delays, no paper forms, no uncertainty.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">How it works</p>
            <h2 className="text-3xl font-display font-semibold">A secure, transparent workflow</h2>
            <p className="text-sm text-slate-600">
              Every certificate is hashed, serialized, and issued with a unique QR code. Admins approve registrations
              and track activity logs to ensure integrity at every step.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              ['Register & Verify', 'Email verification and admin approval ensure legitimate onboarding.'],
              ['Issue Certificates', 'Institutions generate professional PDFs with QR codes and serials.'],
              ['Verify Instantly', 'Public verification confirms authenticity within seconds.'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <h4 className="text-base font-display font-semibold">{title}</h4>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
