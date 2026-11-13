import AppointmentsView from '../../components/AppointmentsView.jsx';

export default function AdminAppointments() {
  return <AppointmentsView title="All appointments" subtitle="Every appointment across all teachers and students." emptyTitle="No appointments yet" emptyMessage="Appointments will appear here once students start booking." />;
}
