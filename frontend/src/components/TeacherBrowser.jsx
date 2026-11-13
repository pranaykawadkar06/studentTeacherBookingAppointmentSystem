import { useEffect, useState } from 'react';
import { FiUsers } from 'react-icons/fi';
import { teacherService } from '../services/teacherService';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import SearchInput from './SearchInput.jsx';
import TeacherCard from './TeacherCard.jsx';
import Pagination from './Pagination.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import { PageLoader } from './Spinner.jsx';

// Teacher search + grid, shared by the public directory and the student dashboard area.
export default function TeacherBrowser({ basePath }) {
  const [q, setQ] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q);

  useEffect(() => setPage(1), [dq, department]);

  const departments = useFetch(() => teacherService.departments(), []);
  const { data, pagination, loading, error, reload } = useFetch(
    () => teacherService.list({ q: dq || undefined, department: department || undefined, page, limit: 9 }),
    [dq, department, page]
  );

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <SearchInput value={q} onChange={setQ} placeholder="Search by name, department or subject" label="Search teachers" />
        <div>
          <label htmlFor="dept-filter" className="sr-only">
            Department
          </label>
          <select id="dept-filter" className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All departments</option>
            {(departments.data || []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !data ? (
        <PageLoader label="Loading teachers…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState icon={FiUsers} title="No teachers found" message="Try a different name, subject or department." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((t) => (
              <TeacherCard key={t._id} teacher={t} basePath={basePath} />
            ))}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
