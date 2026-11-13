// Wraps an input with a label and error text. Pass your own control as children (select/textarea),
// or pass input props directly to render a text input.
export default function FormField({ label, id, error, hint, required, children, ...inputProps }) {
  const control =
    children ?? (
      <input id={id} className={`input ${error ? 'border-red-500' : ''}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} required={required} {...inputProps} />
    );
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {control}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
