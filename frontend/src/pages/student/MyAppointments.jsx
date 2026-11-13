import { Link } from 'react-router-dom';
import AppointmentsView from '../../components/AppointmentsView.jsx';

export default function MyAppointments() {
  return (
    <AppointmentsView
      title="My appointments"
      subtitle="Your requests and their current status."
      emptyTitle="You haven’t booked anything yet"
      emptyMessage="Pick a teacher and choose an open slot to send your first request."
      emptyAction={<Link to="/student/teachers" className="btn-primary">Find a teacher</Link>}
    />
  );
}
