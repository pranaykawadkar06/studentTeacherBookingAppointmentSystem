import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiUserCheck, FiX } from 'react-icons/fi';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { userService } from '../../services/userService';
import { adminService } from '../../services/adminService';
import { formatDateTime, getErrorMessage, emailNote } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader.jsx';
import SearchInput from '../../components/SearchInput.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { PageLoader, Spinner } from '../../components/Spinner.jsx';

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: '', label: 'All' },
];

export default function StudentApprovals() {
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const [busyId, setBusyId] = useState(null);
  const [toReject, setToReject] = useState(null);
  useEffect(() => setPage(1), [tab, dq]);

  const { data, pagination, loading, error, reload } = useFetch(() => userService.list({ role: 'student', registrationStatus: tab || undefined, q: dq || undefined, page, limit: 10 }), [tab, dq, page]);

  const setStatus = async (student, status) => {
    setBusyId(student._id);
    try {
      const res = await adminService.setStudentStatus(student._id, status);
      toast.success(`${student.name} was ${status}.${emailNote(res.data.data.emailStatus)}`);
      setToReject(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Student approvals" subtitle="Students can only book appointments after you approve them." />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {TABS.map((t) => (
            <button key={t.label} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)} className={`btn btn-sm ${tab === t.id ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{t.label}</button>
          ))}
        </div>
        <div className="md:w-80"><SearchInput value={q} onChange={setQ} placeholder="Search name, email or roll number" label="Search students" /></div>
      </div>

      {loading && !data ? <PageLoader label="Loading students…" /> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
        <EmptyState icon={FiUserCheck} title={tab === 'pending' && !dq ? 'No pending registrations' : 'No students found'} message={tab === 'pending' && !dq ? 'New student registrations will appear here for review.' : 'Try another filter or search.'} />
      ) : (
        <>
          <div className={`card overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr><th className="px-4 py-3 font-medium">Student</th><th className="px-4 py-3 font-medium">Course</th><th className="px-4 py-3 font-medium">Registered</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 py-3"><p className="font-medium text-slate-900">{s.name}</p><p className="text-xs text-slate-500">{s.email}{s.rollNumber ? `, roll ${s.rollNumber}` : ''}</p></td>
                    <td className="px-4 py-3">{s.course || <span className="text-slate-400">Not given</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(s.createdAt)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.registrationStatus} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {s.registrationStatus !== 'approved' && (
                          <button type="button" className="btn-success btn-sm" onClick={() => setStatus(s, 'approved')} disabled={busyId === s._id}>
                            {busyId === s._id ? <Spinner className="h-3.5 w-3.5" /> : <FiCheck aria-hidden="true" />} Approve
                          </button>
                        )}
                        {s.registrationStatus !== 'rejected' && (
                          <button type="button" className="btn-secondary btn-sm text-red-600" onClick={() => setToReject(s)} disabled={busyId === s._id}><FiX aria-hidden="true" /> Reject</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <ConfirmDialog open={Boolean(toReject)} danger loading={busyId === toReject?._id} title="Reject this registration?" message={toReject ? `${toReject.name} will not be able to book appointments. You can approve them later if this was a mistake.` : ''} confirmLabel="Reject student" onConfirm={() => setStatus(toReject, 'rejected')} onCancel={() => setToReject(null)} />
    </div>
  );
}
