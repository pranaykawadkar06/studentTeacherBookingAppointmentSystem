import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { Spinner } from './Spinner.jsx';

/**
 * Confirmation modal. Pass `reasonLabel` to show a reason textarea (required when `requireReason`).
 * onConfirm receives the trimmed reason (or '').
 */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, reasonLabel, requireReason = false, loading = false, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  const missing = requireReason && reason.trim().length < 3;
  const submit = () => {
    if (missing) return setTouched(true);
    onConfirm(reason.trim());
  };

  return (
    <Modal open={open} onClose={loading ? () => {} : onCancel} title={title} size="sm">
      {message && <p className="text-sm text-slate-600">{message}</p>}
      {reasonLabel && (
        <div className="mt-4">
          <label htmlFor="confirm-reason" className="label">
            {reasonLabel}
            {requireReason && <span className="text-red-500"> *</span>}
          </label>
          <textarea id="confirm-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="input" />
          {touched && missing && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              Please enter at least 3 characters.
            </p>
          )}
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Keep as is
        </button>
        <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={submit} disabled={loading}>
          {loading && <Spinner className="h-4 w-4" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
