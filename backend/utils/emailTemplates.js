export const escapeHtml = (v = '') =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const build = ({ title, intro, rows = [], note, action }) => {
  const rowsHtml = rows.length
    ? `<table style="border-collapse:collapse;margin:16px 0;width:100%">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 0;color:#0f172a">${escapeHtml(v)}</td></tr>`
        )
        .join('')}</table>`
    : '';
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><div style="background:#0f172a;color:#fff;padding:16px 24px;font-size:18px;font-weight:bold">Student–Teacher Booking</div><div style="padding:24px;color:#0f172a;line-height:1.5"><h2 style="margin:0 0 12px;font-size:20px">${escapeHtml(title)}</h2><p style="margin:0">${escapeHtml(intro)}</p>${rowsHtml}${action ? `<p style="margin:20px 0"><a href="${escapeHtml(action.url)}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">${escapeHtml(action.label)}</a></p><p style="margin:0;color:#64748b;font-size:13px;word-break:break-all">${escapeHtml(action.url)}</p>` : ''}${note ? `<p style="margin:16px 0 0;color:#475569">${escapeHtml(note)}</p>` : ''}</div></div></div>`;
  const text = [title, '', intro, '', ...rows.map(([k, v]) => `${k}: ${v}`), action ? `\n${action.label}: ${action.url}` : '', note ? `\n${note}` : ''].join('\n');
  return { html, text };
};

const when = (a) => `${a.date}, ${a.startTime} – ${a.endTime}`;

export const bookingRequestEmail = (a) => ({
  subject: `New appointment request from ${a.student.name}`,
  ...build({
    title: 'New appointment request',
    intro: `${a.student.name} has requested an appointment with you.`,
    rows: [['Student', a.student.name], ['When', when(a)], ['Purpose', a.purpose]],
    note: 'Sign in to approve or reject this request.',
  }),
});

export const approvedEmail = (a) => ({
  subject: 'Your appointment was approved',
  ...build({
    title: 'Appointment approved',
    intro: `${a.teacher.name} approved your appointment request.`,
    rows: [['Teacher', a.teacher.name], ['When', when(a)], ['Purpose', a.purpose], ...(a.decisionNote ? [['Note from teacher', a.decisionNote]] : [])],
  }),
});

export const rejectedEmail = (a) => ({
  subject: 'Your appointment request was declined',
  ...build({
    title: 'Appointment declined',
    intro: `${a.teacher.name} could not accept your appointment request.`,
    rows: [['Teacher', a.teacher.name], ['When', when(a)], ...(a.decisionNote ? [['Reason', a.decisionNote]] : [])],
    note: 'You can book another available slot from the teacher’s page.',
  }),
});

export const cancelledEmail = (a, cancelledBy) => ({
  subject: 'An appointment was cancelled',
  ...build({
    title: 'Appointment cancelled',
    intro: `${cancelledBy === 'teacher' ? a.teacher.name : a.student.name} cancelled this appointment.`,
    rows: [['Student', a.student.name], ['Teacher', a.teacher.name], ['When', when(a)], ...(a.cancellationReason ? [['Reason', a.cancellationReason]] : [])],
  }),
});

export const registrationDecisionEmail = (user, status) => ({
  subject: status === 'approved' ? 'Your registration was approved' : 'Your registration was not approved',
  ...build({
    title: status === 'approved' ? 'Registration approved' : 'Registration not approved',
    intro:
      status === 'approved'
        ? `Hi ${user.name}, your account has been approved. You can now sign in and book appointments.`
        : `Hi ${user.name}, an administrator did not approve your registration. Please contact your institution for details.`,
  }),
});

export const newMessageEmail = (sender, message) => ({
  subject: `New message from ${sender.name}: ${message.subject}`,
  ...build({
    title: 'You have a new message',
    intro: `${sender.name} sent you a message.`,
    rows: [['Subject', message.subject], ['Message', message.content]],
    note: 'Sign in to reply.',
  }),
});

export const passwordResetEmail = (user, url, minutes) => ({
  subject: 'Reset your password',
  ...build({
    title: 'Reset your password',
    intro: `Hi ${user.name}, we received a request to reset the password for your account.`,
    action: { label: 'Choose a new password', url },
    note: `This link works once and expires in ${minutes} minutes. If you didn’t ask for this, you can ignore this email and your password will stay the same.`,
  }),
});
