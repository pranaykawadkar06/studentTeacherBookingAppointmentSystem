import AppointmentsView from '../../components/AppointmentsView.jsx';

export default function TeacherAppointments() {
  return <AppointmentsView title="All appointments" subtitle="Pending, approved, rejected and cancelled appointments." emptyTitle="No appointments yet" emptyMessage="Add availability so students can start booking." />;
}
