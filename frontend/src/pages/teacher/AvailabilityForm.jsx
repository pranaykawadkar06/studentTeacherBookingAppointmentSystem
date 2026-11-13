import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import { availabilityService } from '../../services/availabilityService';
import { getErrorMessage, todayStr } from '../../utils/formatters';
import { SLOT_DURATIONS } from '../../utils/constants';
import PageHeader from '../../components/PageHeader.jsx';
import FormField from '../../components/FormField.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { PageLoader, Spinner } from '../../components/Spinner.jsx';

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export default function AvailabilityForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', slotDuration: 30, repeatWeeks: 0, status: 'available' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const existing = useFetch(() => (editing ? availabilityService.get(id) : Promise.resolve({ data: { data: null } })), [id]);
  useEffect(() => {
    const s = existing.data?.slot;
    if (s) setForm((f) => ({ ...f, date: s.date, startTime: s.startTime, endTime: s.endTime, status: s.status === 'blocked' ? 'blocked' : 'available' }));
  }, [existing.data]);

  if (editing && existing.loading && !existing.data) return <PageLoader />;
  if (editing && existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;
  const booked = existing.data?.slot?.status === 'booked';

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const validTimes = form.startTime && form.endTime && toMin(form.endTime) > toMin(form.startTime);
  const perDay = !editing && validTimes ? Math.floor((toMin(form.endTime) - toMin(form.startTime)) / Number(form.slotDuration)) : 0;
  const total = perDay * (Number(form.repeatWeeks) + 1);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.date) next.date = 'Choose a date';
    else if (form.date < todayStr()) next.date = 'Choose today or a later date';
    if (!form.startTime) next.startTime = 'Choose a start time';
    if (!form.endTime) next.endTime = 'Choose an end time';
    if (form.startTime && form.endTime && !validTimes) next.endTime = 'End time must be after start time';
    if (!editing && validTimes && perDay < 1) next.endTime = 'The window is shorter than one slot';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      if (editing) {
        await availabilityService.update(id, { date: form.date, startTime: form.startTime, endTime: form.endTime, status: form.status });
        toast.success('Slot updated');
      } else {
        const res = await availabilityService.create({ date: form.date, startTime: form.startTime, endTime: form.endTime, slotDuration: Number(form.slotDuration), repeatWeeks: Number(form.repeatWeeks) });
        toast.success(res.data.message);
      }
      navigate('/teacher/availability');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title={editing ? 'Edit slot' : 'Add availability'} subtitle={editing ? 'Change the time of a single slot, or block it.' : 'Enter a time window. It is split into slots of the length you choose.'} />
      {booked && <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This slot is booked. Cancel the appointment first if you need to change it.</p>}
      <form onSubmit={submit} noValidate className="card grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2"><FormField label="Date" id="date" type="date" min={todayStr()} required value={form.date} onChange={set('date')} error={errors.date} disabled={booked} /></div>
        <FormField label="Start time" id="startTime" type="time" required value={form.startTime} onChange={set('startTime')} error={errors.startTime} disabled={booked} />
        <FormField label="End time" id="endTime" type="time" required value={form.endTime} onChange={set('endTime')} error={errors.endTime} disabled={booked} />
        {!editing ? (
          <>
            <FormField label="Slot length" id="slotDuration">
              <select id="slotDuration" className="input" value={form.slotDuration} onChange={set('slotDuration')}>
                {SLOT_DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </FormField>
            <FormField label="Repeat weekly for" id="repeatWeeks" type="number" min="0" max="8" value={form.repeatWeeks} onChange={set('repeatWeeks')} hint="Extra weeks, 0 to 8. Use 0 for a single day." />
            {total > 0 && <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900 sm:col-span-2">This will create {total} slot{total === 1 ? '' : 's'}.</p>}
          </>
        ) : (
          <div className="sm:col-span-2">
            <FormField label="Status" id="status">
              <select id="status" className="input" value={form.status} onChange={set('status')} disabled={booked}>
                <option value="available">Available</option>
                <option value="blocked">Blocked (hidden from students)</option>
              </select>
            </FormField>
          </div>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving || booked}>{saving && <Spinner className="h-4 w-4" />} {editing ? 'Save changes' : 'Create slots'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/teacher/availability')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
