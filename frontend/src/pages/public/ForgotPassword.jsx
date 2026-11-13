import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import FormField from '../../components/FormField.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { isEmail } from '../../utils/validators';
import { getErrorMessage } from '../../utils/formatters';

export default function ForgotPassword() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState('');

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) return setError('Enter a valid email address');
    setError('');
    setSubmitting(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSentTo(email.trim());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="card p-8 text-center">
          <FiMail className="mx-auto h-10 w-10 text-indigo-500" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Check your email</h1>
          <p className="mt-2 text-sm text-slate-600">
            If an account exists for <span className="font-medium">{sentTo}</span>, we’ve sent a link to choose a new password. It works once and expires in 30 minutes.
          </p>
          <p className="mt-2 text-sm text-slate-500">Nothing after a few minutes? Check your spam folder, or ask an administrator whether email is set up.</p>
          <Link to="/login" className="btn-primary mt-6">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your account email and we’ll send you a reset link.</p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <FormField label="Email" id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />} Send reset link
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Remembered it? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
