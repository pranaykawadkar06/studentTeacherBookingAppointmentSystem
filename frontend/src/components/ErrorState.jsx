import { FiAlertCircle } from 'react-icons/fi';

export default function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="card flex flex-col items-center px-6 py-10 text-center">
      <FiAlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-slate-900">Couldn’t load this page</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          Try again
        </button>
      )}
    </div>
  );
}
