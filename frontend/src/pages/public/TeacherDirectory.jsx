import useAuth from '../../hooks/useAuth';
import TeacherBrowser from '../../components/TeacherBrowser.jsx';

export default function TeacherDirectory() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Teachers</h1>
      <p className="mb-8 mt-2 text-slate-600">
        {user ? 'Open a profile to see available slots.' : 'Browse our teachers. Register or sign in as a student to book a slot.'}
      </p>
      <TeacherBrowser basePath="/teachers" />
    </div>
  );
}
