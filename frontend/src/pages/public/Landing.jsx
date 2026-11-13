import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiCalendar, FiCheckCircle, FiClock, FiMail, FiMessageSquare, FiShield } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';

const FEATURES = [
  { icon: FiClock, title: 'See real availability', text: 'Teachers publish the exact slots they can meet. You only see times that are actually open.' },
  { icon: FiCheckCircle, title: 'No double bookings', text: 'Each slot can be held by one student at a time, even if two people click at the same moment.' },
  { icon: FiMail, title: 'Email updates', text: 'Approvals, rejections and cancellations are emailed to the person affected.' },
  { icon: FiMessageSquare, title: 'Built-in messages', text: 'Ask a question or reschedule without leaving the app.' },
  { icon: FiShield, title: 'Approved students only', text: 'An administrator approves every student account before booking is unlocked.' },
];

const STEPS = [
  { title: 'Register and get approved', text: 'Create a student account. An administrator reviews and approves it.' },
  { title: 'Find your teacher', text: 'Search by name, department or subject and open their profile.' },
  { title: 'Pick a slot and send a request', text: 'Choose an open time and say what you want to discuss.' },
  { title: 'Wait for the answer', text: 'The teacher approves or declines. You see the result in My appointments and by email.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <>
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">Book time with your teachers without the back-and-forth</h1>
            <p className="mt-5 max-w-lg text-lg text-slate-300">Browse open slots, request an appointment, and get an answer by email. Teachers stay in control of their calendar; students stop chasing replies.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link to={user.role === 'student' && user.registrationStatus !== 'approved' ? '/pending' : `/${user.role}/dashboard`} className="btn-primary px-6 py-3 text-base">Go to your dashboard</Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary px-6 py-3 text-base">Register as a student</Link>
                  <Link to="/login" className="btn border border-slate-500 px-6 py-3 text-base text-white hover:bg-slate-800">Sign in</Link>
                </>
              )}
              <Link to="/teachers" className="btn px-6 py-3 text-base text-slate-200 hover:bg-slate-800">Browse teachers</Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 text-slate-800 shadow-2xl" aria-hidden="true">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">DR</span>
              <div>
                <p className="font-semibold">Dr. Rao</p>
                <p className="text-sm text-slate-500">Physics, Optics</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">Open slots on Thursday</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              {['10:00 AM', '10:30 AM', '11:00 AM'].map((t, i) => (
                <span key={t} className={`rounded-lg border px-2 py-2 ${i === 1 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>{t}</span>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              <FiCalendar className="mr-2 inline" />Request sent. You will get an email when Dr. Rao replies.
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-slate-900">About the system</h2>
          <p className="mt-3 max-w-2xl text-slate-600">Meeting a teacher usually means emails, hallway guesses and missed messages. This system gives each teacher a calendar of open slots and gives each student a clear way to request one.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-slate-200 p-5">
                <Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">{i + 1}</span>
                <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-xl bg-slate-900 p-5 text-slate-300"><h3 className="font-semibold text-white">Students</h3><p className="mt-1 text-sm">Search teachers, book slots, track requests, cancel when plans change and message teachers.</p></div>
            <div className="rounded-xl bg-slate-900 p-5 text-slate-300"><h3 className="font-semibold text-white">Teachers</h3><p className="mt-1 text-sm">Publish availability, approve or decline requests, cancel with a reason and reply to students.</p></div>
            <div className="rounded-xl bg-slate-900 p-5 text-slate-300"><h3 className="font-semibold text-white">Administrators</h3><p className="mt-1 text-sm">Approve students, manage teacher accounts and see every appointment in one place.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
