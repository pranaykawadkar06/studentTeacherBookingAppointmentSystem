import { Link } from 'react-router-dom';
import { FiCalendar, FiCheckCircle, FiClock, FiList } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { dashboardService } from '../../services/dashboardService';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import AppointmentSummaryList from '../../components/AppointmentSummaryList.jsx';
import TeacherCard from '../../components/TeacherCard.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { PageLoader } from '../../components/Spinner.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => dashboardService.get(), []);
  if (loading && !data) return <PageLoader label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle="Here is what’s coming up." actions={<Link to="/student/teachers" className="btn-primary">Find a teacher</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming" value={data.upcomingCount} icon={FiCalendar} />
        <StatCard label="Pending requests" value={data.pendingRequests} icon={FiClock} tone="amber" />
        <StatCard label="Approved or completed" value={data.approvedCount} icon={FiCheckCircle} tone="emerald" />
        <StatCard label="Total appointments" value={data.totalAppointments} icon={FiList} tone="slate" />
      </div>
      {data.unreadMessages > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          <span>You have {data.unreadMessages} unread message{data.unreadMessages === 1 ? '' : 's'}.</span>
          <Link to="/student/messages" className="btn-primary btn-sm">Open inbox</Link>
        </div>
      )}

      <section className="card mt-6">
        <div className="flex items-center justify-between px-5 pt-5"><h2 className="font-semibold text-slate-900">Upcoming appointments</h2><Link to="/student/appointments" className="text-sm text-indigo-600 hover:underline">View all</Link></div>
        <AppointmentSummaryList items={data.upcomingAppointments} who="teacher" emptyText="No upcoming appointments. Find a teacher to book one." />
      </section>

      {data.featuredTeachers.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-semibold text-slate-900">Teachers you can book</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.featuredTeachers.map((t) => <TeacherCard key={t._id} teacher={t} basePath="/student/teachers" />)}
          </div>
        </section>
      )}
    </div>
  );
}
