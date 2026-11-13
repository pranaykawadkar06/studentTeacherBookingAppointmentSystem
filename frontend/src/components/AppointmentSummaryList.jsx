import { formatDate, formatTime } from '../utils/formatters';
import StatusBadge from './StatusBadge.jsx';

// Compact list used on dashboards. `who` = which party to show: 'teacher' | 'student' | 'both'.
export default function AppointmentSummaryList({ items, who, emptyText = 'Nothing here yet.' }) {
  if (!items?.length) return <p className="px-5 py-8 text-center text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => (
        <li key={a._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {who === 'student' ? a.student?.name || 'Deleted student' : who === 'both' ? `${a.student?.name || 'Deleted'} with ${a.teacher?.name || 'Deleted'}` : a.teacher?.name || 'Deleted teacher'}
            </p>
            <p className="text-xs text-slate-500">
              {formatDate(a.date)}, {formatTime(a.startTime)} to {formatTime(a.endTime)}
            </p>
          </div>
          <StatusBadge status={a.status} />
        </li>
      ))}
    </ul>
  );
}
