import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiAward, FiBookOpen, FiClock, FiMapPin, FiMessageSquare } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { teacherService } from '../../services/teacherService';
import { availabilityService } from '../../services/availabilityService';
import { appointmentService } from '../../services/appointmentService';
import { formatDate, formatTime, getErrorMessage, emailNote } from '../../utils/formatters';
import Avatar from '../../components/Avatar.jsx';
import Modal from '../../components/Modal.jsx';
import FormField from '../../components/FormField.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { PageLoader, Spinner } from '../../components/Spinner.jsx';

export default function TeacherDetails({ basePath }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student' && user.registrationStatus === 'approved';

  const teacherRes = useFetch(() => teacherService.get(id), [id]);
  const slotsRes = useFetch(() => (isStudent ? availabilityService.forTeacher(id) : Promise.resolve({ data: { data: [] } })), [id, isStudent]);

  const [selected, setSelected] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [notify, setNotify] = useState(true);
  const [purposeError, setPurposeError] = useState('');
  const [booking, setBooking] = useState(false);

  if (teacherRes.loading && !teacherRes.data) return <div className="mx-auto max-w-5xl px-4 py-10"><PageLoader label="Loading teacher…" /></div>;
  if (teacherRes.error) return <div className="mx-auto max-w-5xl px-4 py-10"><ErrorState message={teacherRes.error} onRetry={teacherRes.reload} /></div>;

  const teacher = teacherRes.data.teacher;
  const grouped = (slotsRes.data || []).reduce((acc, s) => ((acc[s.date] ||= []).push(s), acc), {});

  const openBooking = (slot) => {
    setSelected(slot);
    setPurpose('');
    setPurposeError('');
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (purpose.trim().length < 5) return setPurposeError('Describe what you want to discuss (at least 5 characters)');
    setBooking(true);
    try {
      const res = await appointmentService.create({ availabilityId: selected._id, purpose: purpose.trim(), notifyTeacher: notify });
      toast.success(`Request sent to ${teacher.name}.${emailNote(res.data.data.emailStatus)}`);
      setSelected(null);
      slotsRes.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSelected(null);
      slotsRes.reload(); // the slot may have just been taken
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to={basePath} className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
        <FiArrowLeft aria-hidden="true" /> All teachers
      </Link>

      <section className="card flex flex-col gap-5 p-6 sm:flex-row">
        <Avatar name={teacher.name} src={teacher.profileImage} size="h-20 w-20 text-2xl" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-900">{teacher.name}</h1>
          <p className="text-slate-500">{teacher.department}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
            <li className="flex items-center gap-2"><FiBookOpen className="text-slate-400" aria-hidden="true" /> {teacher.subject}</li>
            <li className="flex items-center gap-2"><FiAward className="text-slate-400" aria-hidden="true" /> {teacher.qualification}</li>
            {teacher.officeLocation && <li className="flex items-center gap-2"><FiMapPin className="text-slate-400" aria-hidden="true" /> {teacher.officeLocation}</li>}
            {teacher.experienceYears != null && <li className="flex items-center gap-2"><FiClock className="text-slate-400" aria-hidden="true" /> {teacher.experienceYears} years of experience</li>}
          </ul>
          {teacher.bio && <p className="mt-3 text-sm text-slate-600">{teacher.bio}</p>}
          {isStudent && (
            <button type="button" className="btn-secondary mt-4" onClick={() => navigate('/student/messages', { state: { recipient: { id: teacher._id, name: teacher.name } } })}>
              <FiMessageSquare aria-hidden="true" /> Message {teacher.name.split(' ')[0]}
            </button>
          )}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="slots-heading">
        <h2 id="slots-heading" className="text-lg font-semibold text-slate-900">Available slots</h2>
        {!user ? (
          <div className="card mt-3 p-6 text-center">
            <p className="text-sm text-slate-600">Sign in with an approved student account to see open times and book.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link to="/login" className="btn-primary">Sign in</Link>
              <Link to="/register" className="btn-secondary">Register</Link>
            </div>
          </div>
        ) : !isStudent ? (
          <p className="card mt-3 p-6 text-sm text-slate-600">Only approved students can book appointments.</p>
        ) : slotsRes.loading && !slotsRes.data ? (
          <PageLoader label="Loading slots…" />
        ) : slotsRes.error ? (
          <div className="mt-3"><ErrorState message={slotsRes.error} onRetry={slotsRes.reload} /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="mt-3"><EmptyState icon={FiClock} title="No open slots right now" message="This teacher hasn’t published upcoming availability. Send them a message or check back later." /></div>
        ) : (
          <div className="mt-3 space-y-4">
            {Object.entries(grouped).map(([date, list]) => (
              <div key={date} className="card p-4">
                <h3 className="text-sm font-semibold text-slate-800">{formatDate(date)}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {list.map((s) => (
                    <button key={s._id} type="button" onClick={() => openBooking(s)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700">
                      {formatTime(s.startTime)} to {formatTime(s.endTime)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={Boolean(selected)} onClose={() => !booking && setSelected(null)} title="Request this appointment">
        {selected && (
          <form onSubmit={submitBooking} noValidate className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium">{teacher.name}</p>
              <p>{formatDate(selected.date)}, {formatTime(selected.startTime)} to {formatTime(selected.endTime)}</p>
            </div>
            <FormField label="What would you like to discuss?" id="purpose" required error={purposeError}>
              <textarea id="purpose" rows={4} maxLength={500} className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              Email the teacher about this request
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setSelected(null)} disabled={booking}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={booking}>
                {booking && <Spinner className="h-4 w-4" />} Send request
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
