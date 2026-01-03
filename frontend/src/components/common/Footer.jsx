import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center">
        <p>EduAuth Registry © 2026. Bangladesh Educational Certificate Verification System.</p>
        <p>Support: support@eduauth.gov.bd</p>
      </div>
    </footer>
  );
}
