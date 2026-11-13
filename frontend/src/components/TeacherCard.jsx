import { Link } from 'react-router-dom';
import { FiBookOpen, FiMapPin } from 'react-icons/fi';
import Avatar from './Avatar.jsx';

export default function TeacherCard({ teacher, basePath }) {
  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-center gap-3">
        <Avatar name={teacher.name} src={teacher.profileImage} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{teacher.name}</h3>
          <p className="truncate text-sm text-slate-500">{teacher.department}</p>
        </div>
      </div>
      <dl className="mt-4 space-y-1.5 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <FiBookOpen className="shrink-0 text-slate-400" aria-hidden="true" />
          <dt className="sr-only">Subject</dt>
          <dd>{teacher.subject}</dd>
        </div>
        {teacher.officeLocation && (
          <div className="flex items-center gap-2">
            <FiMapPin className="shrink-0 text-slate-400" aria-hidden="true" />
            <dt className="sr-only">Office</dt>
            <dd>{teacher.officeLocation}</dd>
          </div>
        )}
      </dl>
      {teacher.bio && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{teacher.bio}</p>}
      <Link to={`${basePath}/${teacher._id}`} className="btn-primary mt-5 w-full">
        View profile and slots
      </Link>
    </article>
  );
}
