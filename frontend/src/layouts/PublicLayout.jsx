import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { FiCalendar, FiMenu, FiX } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';

export default function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const dash = user ? (user.role === 'student' && user.registrationStatus !== 'approved' ? '/pending' : `/${user.role}/dashboard`) : null;
  const link = 'rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 bg-slate-900">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <FiCalendar aria-hidden="true" />
            </span>
            Student–Teacher Booking
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            <NavLink to="/teachers" className={link}>Teachers</NavLink>
            <Link to="/#how-it-works" className={link}>How it works</Link>
            <Link to="/#about" className={link}>About</Link>
            {user ? (
              <Link to={dash} className="btn-primary ml-3">Go to dashboard</Link>
            ) : (
              <>
                <Link to="/login" className={link}>Sign in</Link>
                <Link to="/register" className="btn-primary ml-2">Register as student</Link>
              </>
            )}
          </nav>
          <button type="button" className="rounded-md p-2 text-slate-300 hover:bg-slate-800 md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">
            {open ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <nav aria-label="Mobile" className="flex flex-col gap-1 border-t border-slate-800 px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
            <NavLink to="/teachers" className={link}>Teachers</NavLink>
            <Link to="/#how-it-works" className={link}>How it works</Link>
            <Link to="/#about" className={link}>About</Link>
            {user ? <Link to={dash} className={link}>Go to dashboard</Link> : (
              <>
                <Link to="/login" className={link}>Sign in</Link>
                <Link to="/register" className={link}>Register as student</Link>
              </>
            )}
          </nav>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-slate-900 py-6 text-center text-sm text-slate-400">
        <p>Student–Teacher Booking Appointment System. Built with the MERN stack.</p>
      </footer>
    </div>
  );
}
