import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useFetch from '../../hooks/useFetch';
import { userService } from '../../services/userService';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/formatters';
import { isEmail, passwordError } from '../../utils/validators';
import PageHeader from '../../components/PageHeader.jsx';
import FormField from '../../components/FormField.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { PageLoader, Spinner } from '../../components/Spinner.jsx';

const EMPTY = { name: '', email: '', password: '', department: '', subject: '', qualification: '', officeLocation: '', experienceYears: '', phone: '', profileImage: '', bio: '' };

export default function TeacherForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const existing = useFetch(() => (editing ? userService.get(id) : Promise.resolve({ data: { data: null } })), [id]);
  useEffect(() => {
    const u = existing.data?.user;
    if (u) setForm({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, u[k] ?? ''])), password: '' });
    else if (!editing) setForm(EMPTY);
  }, [existing.data, editing]);

  if (editing && existing.loading && !existing.data) return <PageLoader />;
  if (editing && existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter the teacher’s name';
    if (!isEmail(form.email)) next.email = 'Enter a valid email address';
    if (!editing || form.password) {
      const pe = passwordError(form.password);
      if (pe) next.password = pe;
    }
    ['department', 'subject', 'qualification'].forEach((k) => !form[k].trim() && (next[k] = 'Required'));
    if (form.profileImage && !/^https?:\/\/\S+$/i.test(form.profileImage.trim())) next.profileImage = 'Enter a full URL starting with http(s)://';
    if (form.experienceYears !== '' && (Number(form.experienceYears) < 0 || Number(form.experienceYears) > 60)) next.experienceYears = 'Enter a value between 0 and 60';
    setErrors(next);
    if (Object.keys(next).length) return;

    const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
    body.experienceYears = form.experienceYears === '' ? undefined : Number(form.experienceYears);
    if (editing && !body.password) delete body.password;

    setSaving(true);
    try {
      if (editing) await adminService.updateTeacher(id, body);
      else await adminService.createTeacher(body);
      toast.success(editing ? 'Teacher updated' : 'Teacher added');
      navigate('/admin/teachers');
    } catch (err) {
      const msg = getErrorMessage(err);
      if (err.response?.status === 409) setErrors({ email: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title={editing ? 'Edit teacher' : 'Add teacher'} subtitle={editing ? 'Leave the password blank to keep the current one.' : 'The teacher can sign in with these details straight away.'} />
      <form onSubmit={submit} noValidate className="card grid gap-4 p-6 sm:grid-cols-2">
        <FormField label="Full name" id="name" required value={form.name} onChange={set('name')} error={errors.name} />
        <FormField label="Email" id="email" type="email" required value={form.email} onChange={set('email')} error={errors.email} />
        <FormField label={editing ? 'New password' : 'Password'} id="password" type="password" autoComplete="new-password" required={!editing} value={form.password} onChange={set('password')} error={errors.password} hint="At least 8 characters with a letter and a number" />
        <FormField label="Phone" id="phone" type="tel" value={form.phone} onChange={set('phone')} />
        <FormField label="Department" id="department" required value={form.department} onChange={set('department')} error={errors.department} />
        <FormField label="Subject" id="subject" required value={form.subject} onChange={set('subject')} error={errors.subject} />
        <FormField label="Qualification" id="qualification" required value={form.qualification} onChange={set('qualification')} error={errors.qualification} />
        <FormField label="Office location" id="officeLocation" value={form.officeLocation} onChange={set('officeLocation')} />
        <FormField label="Years of experience" id="experienceYears" type="number" min="0" max="60" value={form.experienceYears} onChange={set('experienceYears')} error={errors.experienceYears} />
        <FormField label="Profile image URL" id="profileImage" type="url" placeholder="https://…" value={form.profileImage} onChange={set('profileImage')} error={errors.profileImage} />
        <div className="sm:col-span-2">
          <FormField label="Bio" id="bio"><textarea id="bio" rows={3} maxLength={600} className="input" value={form.bio} onChange={set('bio')} /></FormField>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving}>{saving && <Spinner className="h-4 w-4" />} {editing ? 'Save changes' : 'Add teacher'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/teachers')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
