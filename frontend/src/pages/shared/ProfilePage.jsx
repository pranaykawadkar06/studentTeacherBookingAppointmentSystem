import { useState } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { getErrorMessage } from '../../utils/formatters';
import { passwordError } from '../../utils/validators';
import PageHeader from '../../components/PageHeader.jsx';
import FormField from '../../components/FormField.jsx';
import { Spinner } from '../../components/Spinner.jsx';

const FIELDS = {
  teacher: ['department', 'subject', 'qualification', 'officeLocation', 'experienceYears'],
  student: ['course', 'rollNumber'],
  admin: [],
};
const COMMON = ['name', 'phone', 'profileImage', 'bio'];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const keys = [...COMMON, ...FIELDS[user.role]];
  const [form, setForm] = useState(() => Object.fromEntries(keys.map((k) => [k, user[k] ?? ''])));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your name';
    if (user.role === 'teacher') ['department', 'subject', 'qualification'].forEach((k) => !String(form[k]).trim() && (next[k] = 'Required'));
    if (form.profileImage && !/^https?:\/\/\S+$/i.test(form.profileImage.trim())) next.profileImage = 'Enter a full image URL starting with http(s)://';
    setErrors(next);
    if (Object.keys(next).length) return;

    const body = {};
    keys.forEach((k) => {
      const v = typeof form[k] === 'string' ? form[k].trim() : form[k];
      if (k === 'experienceYears') body[k] = v === '' ? undefined : Number(v);
      else body[k] = v;
    });
    setSaving(true);
    try {
      const { data } = await userService.updateMe(body);
      setUser(data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const next = {};
    if (!pw.currentPassword) next.currentPassword = 'Enter your current password';
    const pe = passwordError(pw.newPassword);
    if (pe) next.newPassword = pe;
    if (pw.confirm !== pw.newPassword) next.confirm = 'Passwords do not match';
    setPwErrors(next);
    if (Object.keys(next).length) return;
    setPwSaving(true);
    try {
      await userService.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Profile settings" subtitle="Update your details and password." />

      <form onSubmit={save} noValidate className="card grid gap-4 p-6 sm:grid-cols-2">
        <FormField label="Email" id="p-email" value={user.email} readOnly disabled hint="Email can’t be changed" />
        <FormField label="Role" id="p-role" value={user.role} readOnly disabled />
        <FormField label="Name" id="name" required value={form.name} onChange={set('name')} error={errors.name} />
        <FormField label="Phone" id="phone" type="tel" value={form.phone} onChange={set('phone')} />
        {user.role === 'teacher' && (
          <>
            <FormField label="Department" id="department" required value={form.department} onChange={set('department')} error={errors.department} />
            <FormField label="Subject" id="subject" required value={form.subject} onChange={set('subject')} error={errors.subject} />
            <FormField label="Qualification" id="qualification" required value={form.qualification} onChange={set('qualification')} error={errors.qualification} />
            <FormField label="Office location" id="officeLocation" value={form.officeLocation} onChange={set('officeLocation')} />
            <FormField label="Years of experience" id="experienceYears" type="number" min="0" max="60" value={form.experienceYears} onChange={set('experienceYears')} />
          </>
        )}
        {user.role === 'student' && (
          <>
            <FormField label="Course or program" id="course" value={form.course} onChange={set('course')} />
            <FormField label="Roll number" id="rollNumber" value={form.rollNumber} onChange={set('rollNumber')} />
          </>
        )}
        <div className="sm:col-span-2">
          <FormField label="Profile image URL" id="profileImage" type="url" placeholder="https://…" value={form.profileImage} onChange={set('profileImage')} error={errors.profileImage} />
        </div>
        <div className="sm:col-span-2">
          <FormField label="Bio" id="bio" error={errors.bio}>
            <textarea id="bio" rows={4} maxLength={600} className="input" value={form.bio} onChange={set('bio')} />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary" disabled={saving}>{saving && <Spinner className="h-4 w-4" />} Save changes</button>
        </div>
      </form>

      <form onSubmit={changePassword} noValidate className="card mt-6 grid gap-4 p-6 sm:grid-cols-3">
        <h2 className="text-lg font-semibold text-slate-900 sm:col-span-3">Change password</h2>
        <FormField label="Current password" id="currentPassword" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErrors.currentPassword} />
        <FormField label="New password" id="newPassword" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwErrors.newPassword} />
        <FormField label="Confirm new password" id="confirmPassword" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErrors.confirm} />
        <div className="sm:col-span-3">
          <button type="submit" className="btn-secondary" disabled={pwSaving}>{pwSaving && <Spinner className="h-4 w-4" />} Update password</button>
        </div>
      </form>
    </div>
  );
}
