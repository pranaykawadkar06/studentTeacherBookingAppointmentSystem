import Appointment from '../models/Appointment.js';

/**
 * Marks approved appointments whose end time has passed as "completed".
 * Safe to call often (one indexed updateMany) and never throws, so callers can always await it.
 * Returns the number of appointments updated.
 */
export async function completePastAppointments() {
  try {
    const result = await Appointment.updateMany(
      { status: 'approved', endAt: { $lt: new Date() } },
      // updateMany skips schema hooks, so isActive is cleared here explicitly.
      { $set: { status: 'completed', isActive: false } }
    );
    return result.modifiedCount;
  } catch (err) {
    console.error(`[appointments] Could not mark past appointments as completed: ${err.message}`);
    return 0;
  }
}

// Background sweep so statuses stay correct even when nobody is browsing. Returns a stop function.
export function startCompletionJob(intervalMs = 5 * 60 * 1000) {
  const run = async () => {
    const n = await completePastAppointments();
    if (n > 0) console.log(`[appointments] Marked ${n} appointment(s) as completed`);
  };
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
