import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCalendar, FiCheck } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import { appointmentService } from '../services/appointmentService';
import { formatDate, formatTime, getErrorMessage, emailNote } from '../utils/formatters';
import PageHeader from './PageHeader.jsx';
import SearchInput from './SearchInput.jsx';
import StatusBadge from './StatusBadge.jsx';
import Pagination from './Pagination.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { PageLoader, Spinner } from './Spinner.jsx';

const STATUSES = ['pending', 'approved', 'completed', 'rejected', 'cancelled'];

/**
 * One list for every role. Actions shown depend on the signed-in role:
 *  teacher: approve / reject (pending), cancel (approved, upcoming)
 *  student: cancel (pending or approved, upcoming)
 *  admin:   read-only
 */
export default function AppointmentsView({ title, subtitle, fixedStatus, emptyTitle = 'No appointments yet', emptyMessage, emptyAction }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(fixedStatus || '');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const [dialog, setDialog] = useState(null); // { type: 'reject' | 'cancel', appt }
  const [busy, setBusy] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => setPage(1), [status, dq, from, to]);

  const { data, pagination, loading, error, reload } = useFetch(
    () => appointmentService.list({ status: status || undefined, q: dq || undefined, from: from || undefined, to: to || undefined, page, limit: 10, sort: fixedStatus === 'pending' ? 'asc' : undefined }),
    [status, dq, from, to, page]
  );

  const notify = (res, fallback) => toast.success(`${res.data.message || fallback}.${emailNote(res.data.data?.emailStatus)}`);

  const approve = async (appt) => {
    setApprovingId(appt._id);
    try {
      notify(await appointmentService.approve(appt._id), 'Approved');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      reload();
    } finally {
      setApprovingId(null);
    }
  };

  const confirmDialog = async (reason) => {
    setBusy(true);
    try {
      const res = dialog.type === 'reject' ? await appointmentService.reject(dialog.appt._id, { reason }) : await appointmentService.cancel(dialog.appt._id, { reason });
      notify(res, 'Done');
      setDialog(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDialog(null);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const now = new Date();
  const canAct = (a) => new Date(a.startAt) > now;
  const filtered = Boolean(q || from || to || (status && !fixedStatus));

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_170px_150px_150px]">
        <SearchInput value={q} onChange={setQ} placeholder={user.role === 'admin' ? 'Search by student, teacher or purpose' : 'Search by name or purpose'} label="Search appointments" />
        {fixedStatus ? (
          <div />
        ) : (
          <div>
            <label htmlFor="status-filter" className="sr-only">
              Status
            </label>
            <select id="status-filter" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="from-date" className="sr-only">
            From date
          </label>
          <input id="from-date" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} title="From date" />
        </div>
        <div>
          <label htmlFor="to-date" className="sr-only">
            To date
          </label>
          <input id="to-date" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} title="To date" />
        </div>
      </div>

      {loading && !data ? (
        <PageLoader label="Loading appointments…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState icon={FiCalendar} title={filtered ? 'No matching appointments' : emptyTitle} message={filtered ? 'Try clearing some filters.' : emptyMessage} action={emptyAction} />
      ) : (
        <>
          <ul className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
            {data.map((a) => (
              <li key={a._id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StatusBadge status={a.status} />
                    <span className="font-semibold text-slate-900">{formatDate(a.date)}</span>
                    <span className="text-sm text-slate-600">
                      {formatTime(a.startTime)} to {formatTime(a.endTime)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {user.role !== 'teacher' && (
                      <span>
                        <span className="text-slate-500">Teacher:</span> <span className="font-medium">{a.teacher?.name || 'Deleted teacher'}</span>
                        {a.teacher?.department && <span className="text-slate-500"> ({a.teacher.department})</span>}
                      </span>
                    )}
                    {user.role === 'admin' && <span className="mx-2 text-slate-300">|</span>}
                    {user.role !== 'student' && (
                      <span>
                        <span className="text-slate-500">Student:</span> <span className="font-medium">{a.student?.name || 'Deleted student'}</span>
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{a.purpose}</p>
                  {a.status === 'rejected' && a.decisionNote && <p className="mt-1 text-sm text-red-700">Reason: {a.decisionNote}</p>}
                  {a.status === 'approved' && a.decisionNote && <p className="mt-1 text-sm text-slate-500">Note: {a.decisionNote}</p>}
                  {a.status === 'cancelled' && (
                    <p className="mt-1 text-sm text-slate-500">
                      Cancelled by the {a.cancelledBy}
                      {a.cancellationReason ? `: ${a.cancellationReason}` : '.'}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {user.role === 'teacher' && a.status === 'pending' && canAct(a) && (
                    <>
                      <button type="button" className="btn-success btn-sm" onClick={() => approve(a)} disabled={approvingId === a._id}>
                        {approvingId === a._id ? <Spinner className="h-3.5 w-3.5" /> : <FiCheck aria-hidden="true" />} Approve
                      </button>
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setDialog({ type: 'reject', appt: a })}>
                        Reject
                      </button>
                    </>
                  )}
                  {user.role === 'teacher' && a.status === 'approved' && canAct(a) && (
                    <button type="button" className="btn-secondary btn-sm" onClick={() => setDialog({ type: 'cancel', appt: a })}>
                      Cancel appointment
                    </button>
                  )}
                  {user.role === 'student' && ['pending', 'approved'].includes(a.status) && canAct(a) && (
                    <button type="button" className="btn-secondary btn-sm" onClick={() => setDialog({ type: 'cancel', appt: a })}>
                      Cancel
                    </button>
                  )}
                  {user.role === 'teacher' && a.status === 'pending' && !canAct(a) && <span className="text-xs text-slate-400">Time has passed</span>}
                </div>
              </li>
            ))}
          </ul>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(dialog)}
        loading={busy}
        danger
        title={dialog?.type === 'reject' ? 'Reject this request?' : 'Cancel this appointment?'}
        message={
          dialog
            ? `${formatDate(dialog.appt.date)}, ${formatTime(dialog.appt.startTime)} with ${user.role === 'teacher' ? dialog.appt.student?.name : dialog.appt.teacher?.name}. ${user.role === 'teacher' ? 'The student will be notified by email if email is configured.' : 'Approved appointments can only be cancelled up to the cut-off set by your institution.'}`
            : ''
        }
        reasonLabel={dialog?.type === 'reject' ? 'Reason (optional)' : user.role === 'teacher' ? 'Reason for cancelling' : 'Reason (optional)'}
        requireReason={dialog?.type === 'cancel' && user.role === 'teacher'}
        confirmLabel={dialog?.type === 'reject' ? 'Reject request' : 'Cancel appointment'}
        onConfirm={confirmDialog}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
