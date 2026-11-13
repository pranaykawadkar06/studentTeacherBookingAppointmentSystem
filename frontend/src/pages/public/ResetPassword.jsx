import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { authService } from '../../services/authService';
import FormField from '../../components/FormField.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { passwordError } from '../../utils/validators';
import { getErrorMessage } from '../../utils/formatters';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [linkProblem, setLinkProblem] = useState(!/^[a-fA-F0-9]{64}$/.test(token));

  if (linkProblem) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div role="alert" className="card p-8 text-center">
          <FiAlertCircle className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">This reset link can’t be used</h1>
          <p className="mt-2 text-sm text-slate-600">It may have expired, already been used, or been copied incompletely. Request a new one.</p>
          <Link to="/forgot-password" className="btn-primary mt-6">Request a new link</Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    const pe = passwordError(form.password);
    if (pe) next.password = pe;
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await authService.resetPassword({ token, password: form.password });
      toast.success('Password updated. Sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      if (err.response?.data?.code === 'INVALID_RESET_TOKEN') setLinkProblem(true);
      else toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Choose a new password</h1>
        <p className="mt-1 text-sm text-slate-500">You’ll be signed out everywhere else once it’s changed.</p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <FormField label="New password" id="password" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} hint="At least 8 characters with a letter and a number" />
          <FormField label="Confirm new password" id="confirm" type="password" autoComplete="new-password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
          <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />} Update password
          </button>
        </form>
      </div>
    </div>
  );
}
