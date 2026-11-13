import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import * as tpl from '../utils/emailTemplates.js';

let transporter = null;
const getTransporter = () => {
  if (!config.mail.enabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: { user: config.mail.user, pass: config.mail.pass },
    });
  }
  return transporter;
};

export const logMailStatus = () => {
  if (config.mail.enabled) console.log(`[mail] SMTP configured (${config.mail.host}:${config.mail.port})`);
  else console.warn('[mail] SMTP is not configured. The app works, but no emails will be sent. Set MAIL_* variables to enable.');
};

/**
 * Sends one email. Never throws.
 * Returns 'sent' | 'not_configured' | 'failed' | 'skipped'.
 */
export async function deliver(to, content) {
  if (!to) return 'skipped';
  const t = getTransporter();
  if (!t) return 'not_configured';
  try {
    await t.sendMail({ from: config.mail.from, to, subject: content.subject, html: content.html, text: content.text });
    return 'sent';
  } catch (err) {
    // Log only the error code/summary, never credentials.
    console.error(`[mail] Delivery failed (${err.code || err.responseCode || 'unknown'}): ${String(err.message).split('\n')[0]}`);
    return 'failed';
  }
}

// Expect appointments populated with student {name,email} and teacher {name,email}.
export const emails = {
  bookingRequested: (a) => deliver(a.teacher?.email, tpl.bookingRequestEmail(a)),
  approved: (a) => deliver(a.student?.email, tpl.approvedEmail(a)),
  rejected: (a) => deliver(a.student?.email, tpl.rejectedEmail(a)),
  cancelled: (a, cancelledBy) =>
    deliver(cancelledBy === 'teacher' ? a.student?.email : a.teacher?.email, tpl.cancelledEmail(a, cancelledBy)),
  registrationDecision: (user, status) => deliver(user.email, tpl.registrationDecisionEmail(user, status)),
  newMessage: (sender, recipient, message) => deliver(recipient.email, tpl.newMessageEmail(sender, message)),
  passwordReset: (user, url, minutes) => deliver(user.email, tpl.passwordResetEmail(user, url, minutes)),
};
