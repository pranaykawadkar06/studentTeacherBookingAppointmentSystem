export default function StatCard({ label, value, icon: Icon, tone = 'indigo', hint }) {
  const tones = { indigo: 'bg-indigo-100 text-indigo-600', amber: 'bg-amber-100 text-amber-600', emerald: 'bg-emerald-100 text-emerald-600', sky: 'bg-sky-100 text-sky-600', slate: 'bg-slate-200 text-slate-600' };
  return (
    <div className="card flex items-center gap-4 p-5">
      {Icon && (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}
