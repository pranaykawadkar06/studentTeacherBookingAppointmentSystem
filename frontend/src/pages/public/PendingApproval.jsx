import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FiClock, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { PageLoader, Spinner } from '../../components/Spinner.jsx';

export default function PendingApproval() {
  const { user, loading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'student' || user.registrationStatus === 'approved') return <Navigate to={`/${user.role}/dashboard`} replace />;

  const rejected = user.registrationStatus === 'rejected';
  const check = async () => {
    setChecking(true);
    const u = await refreshUser();
    setChecking(false);
    if (u?.registrationStatus === 'approved') {
      toast.success('Your account has been approved');
      navigate('/student/dashboard');
    } else toast.info('Still waiting for approval');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card p-8 text-center">
        {rejected ? <FiXCircle className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" /> : <FiClock className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />}
        <h1 className="mt-4 text-xl font-semibold text-slate-900">{rejected ? 'Registration not approved' : 'Waiting for approval'}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {rejected ? 'An administrator did not approve this account. Please contact your institution for details.' : `Hi ${user.name.split(' ')[0]}, an administrator still needs to approve your account before you can book appointments.`}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {!rejected && (
            <button type="button" className="btn-primary" onClick={check} disabled={checking}>
              {checking && <Spinner className="h-4 w-4" />} Check status
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={async () => { await logout(); navigate('/login'); }}>Sign out</button>
        </div>
        <Link to="/teachers" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">Browse teachers meanwhile</Link>
      </div>
    </div>
  );
}
