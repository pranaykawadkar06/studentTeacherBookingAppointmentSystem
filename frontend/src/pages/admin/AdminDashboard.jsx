import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiUserCheck, FiUsers } from 'react-icons/fi';
import useFetch from '../../hooks/useFetch';
import { dashboardService } from '../../services/dashboardService';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import AppointmentSummaryList from '../../components/AppointmentSummaryList.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { PageLoader } from '../../components/Spinner.jsx';

const BAR = { pending: 'bg-amber-500', approved: 'bg-emerald-500', completed: 'bg-sky-500', rejected: 'bg-red-500', cancelled: 'bg-slate-400' };

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch(() => dashboardService.get(), []);
  if (loading && !data) return <PageLoader label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const total = data.totalAppointments;
  return (
    <div>
      <PageHeader title="Admin dashboard" subtitle="A live overview of users and appointments." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Teachers" value={data.totalTeachers} icon={FiUsers} />
        <StatCard label="Students" value={data.totalStudents} icon={FiUsers} tone="sky" />
        <StatCard label="Pending approvals" value={data.pendingStudents} icon={FiUserCheck} tone="amber" />
        <StatCard label="Appointments" value={total} icon={FiCalendar} tone="emerald" />
      </div>
      {data.pendingStudents > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <span><FiClock className="mr-2 inline" aria-hidden="true" />{data.pendingStudents} student registration{data.pendingStudents === 1 ? ' is' : 's are'} waiting for review.</span>
          <Link to="/admin/students" className="btn-primary btn-sm">Review now</Link>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Appointments by status</h2>
          {total === 0 ? <p className="mt-4 text-sm text-slate-500">No appointments yet.</p> : (
            <ul className="mt-4 space-y-3">
              {Object.entries(data.byStatus).map(([s, n]) => (
                <li key={s}>
                  <div className="flex justify-between text-sm"><span className="capitalize text-slate-700">{s}</span><span className="font-medium">{n}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100" role="presentation"><div className={`h-2 rounded-full ${BAR[s]}`} style={{ width: `${(n / total) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card lg:col-span-3">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="font-semibold text-slate-900">Recent activity</h2>
            <Link to="/admin/appointments" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          <AppointmentSummaryList items={data.recentAppointments} who="both" emptyText="No appointment activity yet." />
        </section>
      </div>
    </div>
  );
}
