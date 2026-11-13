import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import FormField from '../../components/FormField.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { isEmail, passwordError } from '../../utils/validators';
import { getErrorMessage } from '../../utils/formatters';

export default function Register() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', course: '', rollNumber: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!isEmail(form.email)) next.email = 'Enter a valid email address';
    const pw = passwordError(form.password);
    if (pw) next.password = pw;
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const { confirm, ...body } = form;
      Object.keys(body).forEach((k) => typeof body[k] === 'string' && !body[k].trim() && delete body[k]);
      await authService.register(body);
      setDone(true);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (err.response?.status === 409) setErrors({ email: msg });
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="card p-8 text-center">
          <FiCheckCircle className="mx-auto h-10 w-10 text-emerald-500" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Registration submitted</h1>
          <p className="mt-2 text-sm text-slate-600">Your account is pending. An administrator needs to approve it before you can book appointments. Check back after you hear from them.</p>
          <Link to="/login" className="btn-primary mt-6">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Create a student account</h1>
        <p className="mt-1 text-sm text-slate-500">Teacher accounts are created by an administrator.</p>
        <form onSubmit={submit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><FormField label="Full name" id="name" required autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} /></div>
          <div className="sm:col-span-2"><FormField label="Email" id="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} /></div>
          <FormField label="Course or program" id="course" value={form.course} onChange={set('course')} />
          <FormField label="Roll number" id="rollNumber" value={form.rollNumber} onChange={set('rollNumber')} />
          <div className="sm:col-span-2"><FormField label="Phone" id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} /></div>
          <FormField label="Password" id="password" type="password" required autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="At least 8 characters with a letter and a number" />
          <FormField label="Confirm password" id="confirm" type="password" required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4" />} Create account
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
