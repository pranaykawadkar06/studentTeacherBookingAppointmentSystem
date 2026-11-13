import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiInbox, FiList } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { dashboardService } from '../../services/dashboardService';
import { formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import AppointmentSummaryList from '../../components/AppointmentSummaryList.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { PageLoader } from '../../components/Spinner.jsx';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => dashboardService.get(), []);
  if (loading && !data) return <PageLoader label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle={`${user.department}, ${user.subject}`} actions={<Link to="/teacher/availability/new" className="btn-primary">Add availability</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending requests" value={data.pendingRequests} icon={FiInbox} tone="amber" />
        <StatCard label="Upcoming approved" value={data.upcomingCount} icon={FiCalendar} tone="emerald" />
        <StatCard label="Total appointments" value={data.totalAppointments} icon={FiList} />
        <StatCard label="Open slots" value={data.availableSlots} icon={FiClock} tone="sky" />
      </div>
      {data.pendingRequests > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <span>{data.pendingRequests} request{data.pendingRequests === 1 ? ' is' : 's are'} waiting for your answer.</span>
          <Link to="/teacher/requests" className="btn-primary btn-sm">Review requests</Link>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between px-5 pt-5"><h2 className="font-semibold text-slate-900">Upcoming appointments</h2><Link to="/teacher/appointments" className="text-sm text-indigo-600 hover:underline">View all</Link></div>
          <AppointmentSummaryList items={data.upcomingAppointments} who="student" emptyText="No approved appointments coming up." />
        </section>
        <section className="card">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-semibold text-slate-900">Recent messages {data.unreadMessages > 0 && <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">{data.unreadMessages} unread</span>}</h2>
            <Link to="/teacher/messages" className="text-sm text-indigo-600 hover:underline">Open inbox</Link>
          </div>
          {data.recentMessages.length === 0 ? <p className="px-5 py-8 text-center text-sm text-slate-500">No messages yet.</p> : (
            <ul className="divide-y divide-slate-100">
              {data.recentMessages.map((m) => (
                <li key={m._id} className="px-5 py-3">
                  <p className={`truncate text-sm ${m.read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{m.subject}</p>
                  <p className="text-xs text-slate-500">From {m.sender?.name || 'Deleted user'}, {formatDateTime(m.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
