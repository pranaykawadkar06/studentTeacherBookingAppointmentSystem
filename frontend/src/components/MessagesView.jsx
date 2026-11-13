import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiInbox, FiSend } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import useFetch from '../hooks/useFetch';
import { messageService } from '../services/messageService';
import { teacherService } from '../services/teacherService';
import { userService } from '../services/userService';
import { formatDateTime, getErrorMessage, emailNote } from '../utils/formatters';
import PageHeader from './PageHeader.jsx';
import Modal from './Modal.jsx';
import FormField from './FormField.jsx';
import Pagination from './Pagination.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import { PageLoader, Spinner } from './Spinner.jsx';

function ComposeModal({ open, onClose, onSent, prefill }) {
  const { user } = useAuth();
  const isStudent = user.role === 'student';
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [notify, setNotify] = useState(isStudent);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const recipients = useFetch(() => (isStudent ? teacherService.list({ limit: 100 }) : userService.students({ limit: 100 })), [isStudent]);

  useEffect(() => {
    if (open) {
      setRecipientId(prefill?.recipientId || '');
      setSubject(prefill?.subject || '');
      setContent('');
      setErrors({});
    }
  }, [open, prefill]);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!recipientId) next.recipientId = `Choose a ${isStudent ? 'teacher' : 'student'}`;
    if (subject.trim().length < 2) next.subject = 'Add a subject (at least 2 characters)';
    if (!content.trim()) next.content = 'Write a message';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSending(true);
    try {
      const res = await messageService.send({ recipientId, subject: subject.trim(), content: content.trim(), notifyByEmail: notify });
      toast.success(`Message sent.${emailNote(res.data.data.emailStatus)}`);
      onSent();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New message" size="md">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField label={isStudent ? 'To (teacher)' : 'To (student)'} id="msg-to" error={errors.recipientId}>
          <select id="msg-to" className="input" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} disabled={recipients.loading}>
            <option value="">{recipients.loading ? 'Loading…' : 'Select…'}</option>
            {(recipients.data || []).map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
                {r.department ? ` (${r.department})` : ''}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Subject" id="msg-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} error={errors.subject} />
        <FormField label="Message" id="msg-content" error={errors.content}>
          <textarea id="msg-content" rows={5} maxLength={2000} className="input" value={content} onChange={(e) => setContent(e.target.value)} />
        </FormField>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
          Also send an email notification to the {isStudent ? 'teacher' : 'student'}
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending && <Spinner className="h-4 w-4" />} Send message
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function MessagesView() {
  const { user } = useAuth();
  const location = useLocation();
  const [box, setBox] = useState('inbox');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);

  // Arriving from a teacher's profile with a recipient pre-selected
  useEffect(() => {
    const r = location.state?.recipient;
    if (r) {
      setPrefill({ recipientId: r.id, subject: '' });
      setComposeOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => setPage(1), [box]);
  const { data, pagination, loading, error, reload } = useFetch(() => messageService.list({ box, page, limit: 10 }), [box, page]);

  const toggle = async (m) => {
    setOpenId(openId === m._id ? null : m._id);
    if (box === 'inbox' && !m.read) {
      try {
        await messageService.markRead(m._id);
        reload();
      } catch {
        /* non-critical */
      }
    }
  };

  const reply = (m) => {
    setPrefill({ recipientId: m.sender._id, subject: m.subject.startsWith('Re: ') ? m.subject : `Re: ${m.subject}` });
    setComposeOpen(true);
  };

  const tab = (id, label, Icon) => (
    <button type="button" onClick={() => setBox(id)} aria-pressed={box === id} className={`btn ${box === id ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
      <Icon aria-hidden="true" /> {label}
      {id === 'inbox' && pagination?.unread > 0 && <span className="rounded-full bg-white/90 px-1.5 text-xs font-semibold text-indigo-700">{pagination.unread}</span>}
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle={user.role === 'student' ? 'Write to your teachers about appointments or questions.' : 'Read messages from students and reply.'}
        actions={
          <button type="button" className="btn-primary" onClick={() => { setPrefill(null); setComposeOpen(true); }}>
            <FiSend aria-hidden="true" /> New message
          </button>
        }
      />
      <div className="mb-4 flex gap-2">
        {tab('inbox', 'Inbox', FiInbox)}
        {tab('sent', 'Sent', FiSend)}
      </div>

      {loading && !data ? (
        <PageLoader label="Loading messages…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState icon={FiInbox} title={box === 'inbox' ? 'Your inbox is empty' : 'You haven’t sent any messages'} message={box === 'inbox' ? 'Messages sent to you will show up here.' : 'Use “New message” to get in touch.'} />
      ) : (
        <>
          <ul className="card divide-y divide-slate-200">
            {data.map((m) => {
              const other = box === 'inbox' ? m.sender : m.recipient;
              const unread = box === 'inbox' && !m.read;
              const expanded = openId === m._id;
              return (
                <li key={m._id}>
                  <button type="button" onClick={() => toggle(m)} aria-expanded={expanded} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? 'bg-indigo-600' : 'bg-transparent'}`} aria-label={unread ? 'Unread' : undefined} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className={`truncate text-sm ${unread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {box === 'inbox' ? 'From' : 'To'} {other?.name || 'Deleted user'}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">{formatDateTime(m.createdAt)}</span>
                      </span>
                      <span className={`block truncate text-sm ${unread ? 'font-medium' : ''}`}>{m.subject}</span>
                    </span>
                  </button>
                  {expanded && (
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 pl-9">
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{m.content}</p>
                      {box === 'inbox' && m.sender && (
                        <button type="button" className="btn-secondary btn-sm mt-3" onClick={() => reply(m)}>
                          Reply
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} onSent={reload} prefill={prefill} />
    </div>
  );
}
