import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import FormField from '../../components/FormField.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { isEmail } from '../../utils/validators';
import { getErrorMessage } from '../../utils/formatters';

const homeFor = (user) => (user.role === 'student' && user.registrationStatus !== 'approved' ? '/pending' : `/${user.role}/dashboard`);

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!isEmail(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const u = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
      const from = location.state?.from?.pathname;
      navigate(from && from.startsWith(`/${u.role}`) ? from : homeFor(u), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Students, teachers and administrators sign in here.</p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <FormField label="Email" id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
          <FormField label="Password" id="password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} error={errors.password} />
          <div className="-mt-2 text-right"><Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:underline">Forgot password?</Link></div>
          <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />} Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          New student? <Link to="/register" className="font-medium text-indigo-600 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
