import AppointmentsView from '../../components/AppointmentsView.jsx';

export default function AppointmentRequests() {
  return <AppointmentsView title="Appointment requests" subtitle="Students waiting for your answer, soonest first." fixedStatus="pending" emptyTitle="No pending requests" emptyMessage="When a student requests one of your slots it will show up here." />;
}
