import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiEdit2, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { userService } from '../../services/userService';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/formatters';
import PageHeader from '../../components/PageHeader.jsx';
import SearchInput from '../../components/SearchInput.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Avatar from '../../components/Avatar.jsx';
import { PageLoader } from '../../components/Spinner.jsx';

export default function ManageTeachers() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => setPage(1), [dq]);

  const { data, pagination, loading, error, reload } = useFetch(() => userService.list({ role: 'teacher', q: dq || undefined, page, limit: 10 }), [dq, page]);

  const remove = async () => {
    setDeleting(true);
    try {
      await adminService.deleteTeacher(toDelete._id);
      toast.success(`${toDelete.name} was deleted`);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Teachers" subtitle="Add, edit and remove teacher accounts." actions={<Link to="/admin/teachers/new" className="btn-primary"><FiPlus aria-hidden="true" /> Add teacher</Link>} />
      <div className="mb-4 max-w-md"><SearchInput value={q} onChange={setQ} placeholder="Search by name, email, department or subject" label="Search teachers" /></div>

      {loading && !data ? <PageLoader label="Loading teachers…" /> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
        <EmptyState icon={FiUsers} title={dq ? 'No matching teachers' : 'No teachers yet'} message={dq ? 'Try a different search.' : 'Add the first teacher so students can start booking.'} action={!dq && <Link to="/admin/teachers/new" className="btn-primary">Add teacher</Link>} />
      ) : (
        <>
          <div className={`card overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr><th className="px-4 py-3 font-medium">Teacher</th><th className="px-4 py-3 font-medium">Department</th><th className="px-4 py-3 font-medium">Subject</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} src={t.profileImage} size="h-9 w-9 text-sm" />
                        <div><p className="font-medium text-slate-900">{t.name}</p><p className="text-xs text-slate-500">{t.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{t.department}</td>
                    <td className="px-4 py-3">{t.subject}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/teachers/${t._id}/edit`} className="btn-secondary btn-sm" aria-label={`Edit ${t.name}`}><FiEdit2 aria-hidden="true" /> Edit</Link>
                        <button type="button" className="btn-secondary btn-sm text-red-600" onClick={() => setToDelete(t)} aria-label={`Delete ${t.name}`}><FiTrash2 aria-hidden="true" /> Delete</button>
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

      <ConfirmDialog open={Boolean(toDelete)} danger loading={deleting} title="Delete this teacher?" message={toDelete ? `${toDelete.name}’s account and availability will be removed. Teachers with upcoming pending or approved appointments can’t be deleted.` : ''} confirmLabel="Delete teacher" onConfirm={remove} onCancel={() => setToDelete(null)} />
    </div>
  );
}
