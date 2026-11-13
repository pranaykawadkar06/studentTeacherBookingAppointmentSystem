import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCalendar, FiClock, FiGrid, FiHome, FiInbox, FiLogOut, FiMenu, FiMessageSquare, FiUser, FiUserCheck, FiUserPlus, FiUsers, FiX } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import Avatar from '../components/Avatar.jsx';

const NAV = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/admin/students', label: 'Student approvals', icon: FiUserCheck },
    { to: '/admin/teachers', label: 'Teachers', icon: FiUsers, end: true },
    { to: '/admin/teachers/new', label: 'Add teacher', icon: FiUserPlus },
    { to: '/admin/appointments', label: 'Appointments', icon: FiCalendar },
  ],
  teacher: [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/teacher/availability', label: 'My availability', icon: FiClock, end: true },
    { to: '/teacher/requests', label: 'Requests', icon: FiInbox },
    { to: '/teacher/appointments', label: 'All appointments', icon: FiCalendar },
    { to: '/teacher/messages', label: 'Messages', icon: FiMessageSquare },
    { to: '/teacher/profile', label: 'Profile', icon: FiUser },
  ],
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/student/teachers', label: 'Find a teacher', icon: FiUsers },
    { to: '/student/appointments', label: 'My appointments', icon: FiCalendar },
    { to: '/student/messages', label: 'Messages', icon: FiMessageSquare },
    { to: '/student/profile', label: 'Profile', icon: FiUser },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await logout();
    toast.info('You have been signed out');
    navigate('/login');
  };

  const item = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`;

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900">
      <Link to="/" className="flex h-16 items-center gap-2 px-5 text-lg font-semibold text-white" onClick={() => setOpen(false)}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500"><FiCalendar aria-hidden="true" /></span>
        Booking
      </Link>
      <nav aria-label="Dashboard" className="flex-1 space-y-1 overflow-y-auto px-3 py-2" onClick={() => setOpen(false)}>
        {NAV[user.role].map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={item}>
            <Icon className="h-4 w-4" aria-hidden="true" /> {label}
          </NavLink>
        ))}
        <NavLink to="/" end className={item}><FiHome className="h-4 w-4" aria-hidden="true" /> Public site</NavLink>
      </nav>
      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex items-center gap-3 px-2">
          <Avatar name={user.name} src={user.profileImage} size="h-9 w-9 text-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs capitalize text-slate-400">{user.role}</p>
          </div>
        </div>
        <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
          <FiLogOut className="h-4 w-4" aria-hidden="true" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-slate-900 px-4 lg:hidden">
        <span className="font-semibold text-white">Booking</span>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-2 text-slate-300 hover:bg-slate-800">
          <FiMenu className="h-6 w-6" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-2 top-3 z-10 rounded-md p-1 text-slate-300 hover:bg-slate-800">
              <FiX className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
