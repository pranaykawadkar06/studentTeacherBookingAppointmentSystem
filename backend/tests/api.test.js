// Run with: npm test   (downloads an in-memory MongoDB on first run, needs internet once)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod, mongoose, app, request, User, Availability, Appointment;
const PW = 'Passw0rdTest';
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

before(async () => {
  mongod = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongod.getUri('booking_test'),
    JWT_SECRET: 'test_secret_that_is_long_enough_123456',
    TIMEZONE_OFFSET_MINUTES: '0',
    MAIL_USER: '',
    MAIL_PASS: '',
  });
  mongoose = (await import('mongoose')).default;
  app = (await import('../app.js')).default;
  request = (await import('supertest')).default;
  User = (await import('../models/User.js')).default;
  Availability = (await import('../models/Availability.js')).default;
  Appointment = (await import('../models/Appointment.js')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const login = async (email, password = PW) => {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password });
  return { agent, res };
};

test('full workflow: register, approval gate, teacher setup, booking, double-booking, approval, RBAC', async () => {
  await User.create({ name: 'Admin', email: 'admin@test.dev', password: PW, role: 'admin' });
  const admin = (await login('admin@test.dev')).agent;

  // Registration: role escalation attempt is ignored, account is pending, hash is not exposed
  const reg = await request(app).post('/api/auth/register').send({ name: 'Stu One', email: 'stu1@test.dev', password: PW, role: 'admin' });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.data.user.role, 'student');
  assert.equal(reg.body.data.user.registrationStatus, 'pending');
  assert.equal(reg.body.data.user.password, undefined);
  const stored = await User.findOne({ email: 'stu1@test.dev' }).select('+password');
  assert.notEqual(stored.password, PW);
  assert.match(stored.password, /^\$2[aby]\$/);

  // Validation + duplicate email
  assert.equal((await request(app).post('/api/auth/register').send({ name: 'x', email: 'bad', password: '1' })).status, 400);
  assert.equal((await request(app).post('/api/auth/register').send({ name: 'Dup', email: 'stu1@test.dev', password: PW })).status, 409);

  // Pending student cannot use student features
  const stu1 = await login('stu1@test.dev');
  assert.equal(stu1.res.status, 200);
  const blocked = await stu1.agent.get('/api/appointments');
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.code, 'ACCOUNT_NOT_APPROVED');

  // Student cannot hit admin endpoints; unauthenticated gets 401
  assert.equal((await stu1.agent.get('/api/users')).status, 403);
  assert.equal((await request(app).get('/api/dashboard')).status, 401);

  // Admin approves; admin creates two teachers
  const approve = await admin.patch(`/api/admin/students/${stored._id}/status`).send({ status: 'approved' });
  assert.equal(approve.status, 200);
  assert.equal((await stu1.agent.get('/api/appointments')).status, 200);

  const t = { department: 'Physics', subject: 'Optics', qualification: 'PhD', password: PW };
  const t1 = await admin.post('/api/admin/teachers').send({ ...t, name: 'Teacher One', email: 't1@test.dev' });
  const t2 = await admin.post('/api/admin/teachers').send({ ...t, name: 'Teacher Two', email: 't2@test.dev' });
  assert.equal(t1.status, 201);
  assert.equal((await stu1.agent.post('/api/admin/teachers').send({ ...t, name: 'Hack', email: 'h@test.dev' })).status, 403);

  const teacher1 = (await login('t1@test.dev')).agent;
  const teacher2 = (await login('t2@test.dev')).agent;

  // Teacher availability: students cannot create, teachers can, overlaps rejected
  const slotBody = { date: day(2), startTime: '10:00', endTime: '11:00', slotDuration: 30 };
  assert.equal((await stu1.agent.post('/api/availability').send(slotBody)).status, 403);
  const created = await teacher1.post('/api/availability').send(slotBody);
  assert.equal(created.status, 201);
  assert.equal(created.body.data.created, 2);
  assert.equal((await teacher1.post('/api/availability').send(slotBody)).status, 409);
  assert.equal((await teacher1.post('/api/availability').send({ ...slotBody, date: '2000-01-01' })).status, 400);

  const slots = await Availability.find({ teacher: t1.body.data.user._id }).sort({ startAt: 1 });
  // Another teacher cannot modify/delete it
  assert.equal((await teacher2.delete(`/api/availability/${slots[0]._id}`)).status, 404);

  // Book: two students race for the same slot -> exactly one wins
  await request(app).post('/api/auth/register').send({ name: 'Stu Two', email: 'stu2@test.dev', password: PW });
  const s2 = await User.findOne({ email: 'stu2@test.dev' });
  await admin.patch(`/api/admin/students/${s2._id}/status`).send({ status: 'approved' });
  const stu2 = (await login('stu2@test.dev')).agent;

  const book = { availabilityId: String(slots[0]._id), purpose: 'Discuss my project', notifyTeacher: true };
  const [r1, r2] = await Promise.all([stu1.agent.post('/api/appointments').send(book), stu2.post('/api/appointments').send(book)]);
  assert.deepEqual([r1.status, r2.status].sort(), [201, 409]);
  assert.equal(await Appointment.countDocuments({ availability: slots[0]._id, isActive: true }), 1);
  // Email is not configured in tests, and the API must say so honestly
  const winner = r1.status === 201 ? r1 : r2;
  assert.equal(winner.body.data.emailStatus, 'not_configured');

  // Teacher 2 cannot see or approve teacher 1's appointment
  const apptId = winner.body.data.appointment._id;
  assert.equal((await teacher2.patch(`/api/appointments/${apptId}/approve`).send({})).status, 404);
  // Student cannot approve
  assert.equal((await stu1.agent.patch(`/api/appointments/${apptId}/approve`).send({})).status, 403);

  // Teacher 1 approves, second approval conflicts
  assert.equal((await teacher1.patch(`/api/appointments/${apptId}/approve`).send({})).status, 200);
  assert.equal((await teacher1.patch(`/api/appointments/${apptId}/approve`).send({})).status, 409);

  // Rejecting a request frees the slot again
  const book2 = { availabilityId: String(slots[1]._id), purpose: 'Second request here' };
  const second = await stu1.agent.post('/api/appointments').send(book2);
  assert.equal(second.status, 201);
  assert.equal((await teacher1.patch(`/api/appointments/${second.body.data.appointment._id}/reject`).send({ reason: 'Busy' })).status, 200);
  assert.equal((await Availability.findById(slots[1]._id)).status, 'available');

  // The winning student cancels the approved appointment (> 2h away) and the slot reopens
  const winnerAgent = r1.status === 201 ? stu1.agent : stu2;
  assert.equal((await winnerAgent.patch(`/api/appointments/${apptId}/cancel`).send({ reason: 'Plans changed' })).status, 200);
  assert.equal((await Availability.findById(slots[0]._id)).status, 'available');

  // Dashboards are role-specific and real
  const dash = await admin.get('/api/dashboard');
  assert.equal(dash.body.data.role, 'admin');
  assert.equal(dash.body.data.totalTeachers, 2);
  assert.equal(dash.body.data.totalStudents, 2);
});

test('invalid ids and health endpoint', async () => {
  assert.equal((await request(app).get('/api/teachers/not-an-id')).status, 400);
  assert.equal((await request(app).get('/api/health')).body.status, 'ok');
});

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('forgot/reset password: generic answer, single-use token, expiry, old sessions signed out', async () => {
  const user = await User.create({ name: 'Reset Me', email: 'reset@test.dev', password: PW, role: 'student' });

  // Same response whether or not the account exists (no user enumeration)
  const known = await request(app).post('/api/auth/forgot-password').send({ email: 'reset@test.dev' });
  const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@test.dev' });
  assert.equal(known.status, 200);
  assert.equal(unknown.status, 200);
  assert.deepEqual(known.body, unknown.body);
  assert.equal((await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' })).status, 400);

  // Only a hash is stored, with a future expiry
  const stored = await User.findById(user._id).select('+passwordResetToken +passwordResetExpires');
  assert.match(stored.passwordResetToken, /^[a-f0-9]{64}$/);
  assert.ok(stored.passwordResetExpires > new Date());

  // Use a token we know (the real one only exists in the email)
  const token = crypto.randomBytes(32).toString('hex');
  const setToken = (t, ms = 60000) =>
    User.updateOne({ _id: user._id }, { passwordResetToken: sha256(t), passwordResetExpires: new Date(Date.now() + ms) });
  await setToken(token);

  const session = await login('reset@test.dev');
  assert.equal((await session.agent.get('/api/auth/me')).status, 200);

  const reset = (body) => request(app).post('/api/auth/reset-password').send(body);
  assert.equal((await reset({ token: 'abc', password: 'NewPassw0rd' })).status, 400); // malformed token
  assert.equal((await reset({ token: 'a'.repeat(64), password: 'NewPassw0rd' })).status, 400); // unknown token
  assert.equal((await reset({ token, password: 'short' })).status, 400); // weak password

  await sleep(1100); // JWT iat has 1-second resolution
  const ok = await reset({ token, password: 'NewPassw0rd' });
  assert.equal(ok.status, 200);
  assert.equal((await reset({ token, password: 'AnotherPassw0rd' })).status, 400); // single use

  assert.equal((await session.agent.get('/api/auth/me')).status, 401); // old session is dead
  assert.equal((await login('reset@test.dev', PW)).res.status, 401); // old password no longer works
  assert.equal((await login('reset@test.dev', 'NewPassw0rd')).res.status, 200);

  const after = await User.findById(user._id).select('+password +passwordResetToken');
  assert.match(after.password, /^\$2[aby]\$/);
  assert.equal(after.passwordResetToken, undefined);

  const expired = crypto.randomBytes(32).toString('hex');
  await setToken(expired, -1000);
  assert.equal((await reset({ token: expired, password: 'NewPassw0rd2' })).status, 400);
});

test('changing your own password keeps this session and signs out the others', async () => {
  await User.create({ name: 'Two Sessions', email: 'two@test.dev', password: PW, role: 'teacher', department: 'CS', subject: 'Web', qualification: 'MSc' });
  const a = (await login('two@test.dev')).agent;
  const b = (await login('two@test.dev')).agent;
  await sleep(1100);

  assert.equal((await a.put('/api/users/me/password').send({ currentPassword: 'wrong-password1', newPassword: 'Another1Pass' })).status, 400);
  assert.equal((await a.put('/api/users/me/password').send({ currentPassword: PW, newPassword: 'Another1Pass' })).status, 200);
  assert.equal((await a.get('/api/auth/me')).status, 200);
  assert.equal((await b.get('/api/auth/me')).status, 401);
});

test('approved appointments are marked completed automatically once they end', async () => {
  const { completePastAppointments } = await import('../services/appointmentLifecycle.js');
  const student = await User.create({ name: 'Past Student', email: 'past-s@test.dev', password: PW, role: 'student', registrationStatus: 'approved' });
  const teacher = await User.create({ name: 'Past Teacher', email: 'past-t@test.dev', password: PW, role: 'teacher', department: 'Math', subject: 'Algebra', qualification: 'MSc' });

  const HOUR = 36e5;
  const make = (startOffsetHours, status) => {
    const startAt = new Date(Date.now() + startOffsetHours * HOUR);
    return Appointment.create({
      student: student._id, teacher: teacher._id, availability: new mongoose.Types.ObjectId(),
      date: '2000-01-01', startTime: '10:00', endTime: '10:30',
      startAt, endAt: new Date(startAt.getTime() + 0.5 * HOUR), purpose: 'Past session', status,
    });
  };
  const pastApproved = await make(-5, 'approved');
  const pastPending = await make(-6, 'pending');
  const pastCancelled = await make(-7, 'cancelled');
  const futureApproved = await make(5, 'approved');
  const inProgress = await make(-0.1, 'approved'); // started 6 minutes ago, ends in 24

  assert.equal(await completePastAppointments(), 1);
  assert.equal(await completePastAppointments(), 0); // idempotent

  const statusOf = async (a) => (await Appointment.findById(a._id)).status;
  assert.equal(await statusOf(pastApproved), 'completed');
  assert.equal((await Appointment.findById(pastApproved._id)).isActive, false);
  assert.equal(await statusOf(pastPending), 'pending'); // only approved ones complete
  assert.equal(await statusOf(pastCancelled), 'cancelled');
  assert.equal(await statusOf(futureApproved), 'approved');
  assert.equal(await statusOf(inProgress), 'approved'); // not over yet

  // Reading the list also sweeps, so statuses are right even if the background job is late
  await make(-8, 'approved');
  const studentAgent = (await login('past-s@test.dev')).agent;
  const list = await studentAgent.get('/api/appointments?status=completed');
  assert.equal(list.status, 200);
  assert.equal(list.body.pagination.total, 2);

  // Completed appointments are final
  const teacherAgent = (await login('past-t@test.dev')).agent;
  assert.equal((await teacherAgent.patch(`/api/appointments/${pastApproved._id}/approve`).send({})).status, 409);
  assert.equal((await studentAgent.patch(`/api/appointments/${pastApproved._id}/cancel`).send({})).status, 409);
});
