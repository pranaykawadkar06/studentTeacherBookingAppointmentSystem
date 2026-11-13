export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <span role="status" aria-label="Loading" className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 ${className}`} />
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
