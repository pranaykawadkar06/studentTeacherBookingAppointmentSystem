import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheck, FiClock, FiEdit2, FiPlus, FiSlash, FiTrash2 } from 'react-icons/fi';
import useFetch from '../../hooks/useFetch';
import { availabilityService } from '../../services/availabilityService';
import { formatDate, formatTime, getErrorMessage, todayStr } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { PageLoader } from '../../components/Spinner.jsx';

export default function MyAvailability() {
  const [status, setStatus] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setPage(1), [status, showPast]);

  const { data, pagination, loading, error, reload } = useFetch(
    () => availabilityService.mine({ status: status || undefined, from: showPast ? undefined : todayStr(), page, limit: 15 }),
    [status, showPast, page]
  );

  const toggleBlock = async (slot) => {
    try {
      await availabilityService.update(slot._id, { status: slot.status === 'blocked' ? 'available' : 'blocked' });
      toast.success(slot.status === 'blocked' ? 'Slot reopened' : 'Slot blocked');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await availabilityService.remove(toDelete._id);
      toast.success('Slot deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="My availability" subtitle="Slots that students can request." actions={<Link to="/teacher/availability/new" className="btn-primary"><FiPlus aria-hidden="true" /> Add availability</Link>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <label htmlFor="slot-status" className="sr-only">Status</label>
          <select id="slot-status" className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> Include past slots
        </label>
      </div>

      {loading && !data ? <PageLoader label="Loading slots…" /> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
        <EmptyState icon={FiClock} title="No slots to show" message="Create availability so students can book time with you." action={<Link to="/teacher/availability/new" className="btn-primary">Add availability</Link>} />
      ) : (
        <>
          <div className={`card overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Time</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Booked by</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatDate(s.date)}</td>
                    <td className="px-4 py-3">{formatTime(s.startTime)} to {formatTime(s.endTime)} <span className="text-xs text-slate-400">({s.slotDuration} min)</span></td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-slate-600">{s.booking ? `${s.booking.studentName || 'Deleted student'} (${s.booking.status})` : <span className="text-slate-400">None</span>}</td>
                    <td className="px-4 py-3">
                      {s.status !== 'booked' && (
                        <div className="flex justify-end gap-2">
                          <Link to={`/teacher/availability/${s._id}/edit`} className="btn-secondary btn-sm"><FiEdit2 aria-hidden="true" /> Edit</Link>
                          <button type="button" className="btn-secondary btn-sm" onClick={() => toggleBlock(s)}>{s.status === 'blocked' ? <><FiCheck aria-hidden="true" /> Reopen</> : <><FiSlash aria-hidden="true" /> Block</>}</button>
                          <button type="button" className="btn-secondary btn-sm text-red-600" onClick={() => setToDelete(s)} aria-label="Delete slot"><FiTrash2 aria-hidden="true" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}
      <ConfirmDialog open={Boolean(toDelete)} danger loading={busy} title="Delete this slot?" message={toDelete ? `${formatDate(toDelete.date)}, ${formatTime(toDelete.startTime)} to ${formatTime(toDelete.endTime)} will no longer be offered to students.` : ''} confirmLabel="Delete slot" onConfirm={remove} onCancel={() => setToDelete(null)} />
    </div>
  );
}
