import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navLinkClass = ({ isActive }) =>
  `text-sm font-semibold transition ${isActive ? 'text-white' : 'text-white/80 hover:text-white'}`;

export default function Header() {
  const { user, logout } = useAuth();

  const dashboardLink = user?.role === 'STUDENT'
    ? '/student'
    : user?.role === 'INSTITUTION'
      ? '/institution'
      : user?.role === 'ADMIN'
        ? '/admin'
        : '/';

  return (
    <header className="hero-bg">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-white">
        <Link to="/" className="text-lg font-display font-semibold tracking-wide">
          EduAuth Registry
        </Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/verify" className={navLinkClass}>
            Verify
          </NavLink>
          {user ? (
            <>
              <NavLink to={dashboardLink} className={navLinkClass}>
                Dashboard
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide hover:border-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={navLinkClass}>
              Sign In
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
