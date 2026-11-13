# Student–Teacher Booking Appointment System

A MERN-stack web app where approved students book appointments with teachers, teachers manage availability and approve or reject requests, and administrators manage teachers and approve student registrations.

## Features

**Admin**
- Dashboard with live counts (teachers, students, pending approvals, appointments), status breakdown and recent activity
- Add, edit and delete teachers; search and paginate users
- Approve or reject student registrations (an email is sent when SMTP is configured)
- View, search, filter (status, date range) and paginate all appointments

**Teacher**
- Dashboard: pending requests, upcoming approved appointments, total appointments, open slots, recent messages
- Create availability (a time window is split into slots, optionally repeated weekly), edit, block or delete slots
- Approve or reject requests; cancel approved appointments (a reason is required)
- Read and send messages; edit profile and password

**Student**
- Register (account stays *pending* until an admin approves it)
- Search teachers by name, department or subject; view a profile and open slots
- Book a slot, track status, cancel according to the cancellation rule
- Message teachers; edit profile and password

**Cross-cutting**
- JWT in an `httpOnly` cookie, bcrypt password hashing, role-based access control enforced on the backend
- Zod validation on every write endpoint, consistent JSON errors, login/registration rate limiting, Helmet, CORS from env
- Double-booking protection by two layers: an atomic slot claim, plus unique partial indexes in MongoDB (works on a standalone MongoDB, no replica set needed)
- Forgot-password by email: single-use link valid for 30 minutes; only a SHA-256 hash of the token is stored; the response is identical whether or not the email has an account; changing or resetting a password signs out every other session
- Appointments move to **completed** automatically once an approved appointment's end time has passed (background job every 5 minutes, plus a sweep whenever appointment lists or dashboards are read)
- Email notifications via Nodemailer; the API reports the real delivery result (`sent`, `not_configured`, `failed`) and the UI shows it

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router 6, Axios, React Icons, React Toastify |
| Backend | Node.js (ES modules), Express 4, Mongoose 8, JWT, bcrypt, Nodemailer, Zod, Helmet, express-rate-limit |
| Database | MongoDB (Atlas or local) |

## Project structure

```text
student-teacher-booking/
├── frontend/
│   └── src/
│       ├── components/   reusable UI (modals, tables helpers, appointment list, messages…)
│       ├── pages/        public/, admin/, teacher/, student/, shared/
│       ├── layouts/      PublicLayout, DashboardLayout
│       ├── context/      AuthContext
│       ├── hooks/        useAuth, useFetch, useDebounce
│       ├── services/     one Axios module per API group
│       ├── routes/       AppRoutes, ProtectedRoute
│       └── utils/        formatters, validators, constants
├── backend/
│   ├── config/           env validation, DB connection
│   ├── controllers/      request handlers
│   ├── middleware/       auth, validate, rateLimiter, errorHandler
│   ├── models/           User, Availability, Appointment, Message
│   ├── routes/           one router per feature
│   ├── services/         emailService
│   ├── utils/            schemas (Zod), time helpers, seedAdmin, email templates…
│   ├── tests/            api.test.js
│   ├── app.js            Express app (no listen, so it is testable)
│   └── server.js         connects to MongoDB, then starts listening
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 20.10 or newer and npm
- A MongoDB database (a free MongoDB Atlas cluster is fine)
- Optional: an SMTP account (for example Gmail with an app password) to send emails

## MongoDB Atlas setup

1. Create a free cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a database user with a password (use a simple password or URL-encode special characters).
3. **Network Access** → add your current IP address (or `0.0.0.0/0` for local testing only).
4. **Connect** → **Drivers** → copy the connection string, then replace `<USERNAME>`, `<PASSWORD>`, `<CLUSTER_HOST>` and add a database name such as `student_teacher_booking`.

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

Edit `backend/.env`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Your Atlas connection string (required) |
| `JWT_SECRET` | Long random string (required). Generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token and cookie lifetime, e.g. `1d` |
| `CLIENT_URL`, `CORS_ORIGIN` | Frontend origin, e.g. `http://localhost:5173` (CORS accepts a comma-separated list) |
| `MAIL_*` | SMTP settings (optional, see below) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used only by the seed script. Password needs 10+ characters |
| `COOKIE_SECURE`, `COOKIE_SAME_SITE` | `false`/`lax` for local development. In production over HTTPS use `true`, and `none` if the frontend and API are on different sites |
| `TIMEZONE_OFFSET_MINUTES` | Minutes your local time is ahead of UTC (India `330`, UTC `0`). Slot dates/times are interpreted in this offset |
| `CANCELLATION_MIN_HOURS` | Students can cancel an *approved* appointment only this many hours before it starts (default `2`). Pending ones can be cancelled any time before the start |
| `AUTH_RATE_LIMIT_MAX` | Login/registration attempts per IP per 15 minutes (default `20`) |
| `TRUST_PROXY` | Set `true` behind a reverse proxy so rate limiting sees the real client IP |

The server refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing, still contains placeholders, or the secret is too short.

Create the first admin (safe to run repeatedly; it never overwrites an existing account):

```bash
npm run seed:admin
npm run dev        # development with auto-reload
# or: npm start    # production
```

Check it is running: <http://localhost:5000/api/health>

### 2. Frontend (separate terminal)

```bash
cd frontend
npm install
cp .env.example .env.local    # optional if the API runs on http://localhost:5000
npm run dev
```

Open <http://localhost:5173>. Build for production with `npm run build`.

> `VITE_*` variables are public: they are embedded in the built JavaScript. Never put secrets in them.

### 3. SMTP (email notifications)

Email is optional. Without it everything works, the backend logs one warning at start-up, and the UI tells the user no email was sent.

For Gmail: enable 2-Step Verification, create an **App password** at <https://myaccount.google.com/apppasswords>, then set

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=you@gmail.com
MAIL_PASS=<the 16-character app password>
MAIL_FROM=you@gmail.com
```

Use `MAIL_PORT=465` and `MAIL_SECURE=true` for implicit TLS. Never use your normal account password.

Emails are sent for: booking request (to teacher), approval, rejection and cancellation (to the other party), student registration decision, and messages when the sender ticks the email box.

## Password reset

1. On the sign-in page choose **Forgot password?** and enter your email.
2. If an account exists, an email arrives with a link to `CLIENT_URL/reset-password?token=…`. It works once and expires after 30 minutes.
3. Choose a new password. Every existing session is signed out; sign in with the new password.

**This needs working SMTP** (see above). For security the backend never logs the reset link, so with SMTP unconfigured nobody can complete a reset. The log only says that the email was not sent. If you are testing locally without SMTP, set up a Gmail app password, or point `MAIL_*` at a catch-all service such as Mailtrap or Ethereal.

## Appointment statuses

| Status | Meaning |
|---|---|
| `pending` | Requested by the student, waiting for the teacher. Holds the slot |
| `approved` | Accepted by the teacher. Holds the slot |
| `completed` | An approved appointment whose end time has passed. Set automatically, final |
| `rejected` | Declined by the teacher. Slot reopens |
| `cancelled` | Cancelled by the student (slot reopens) or the teacher (slot is blocked) |

Only approved appointments complete. A pending request whose time has passed stays pending (the teacher can no longer approve it) so nothing is silently rewritten.

## Typical walkthrough

1. Seed the admin and sign in at `/login`.
2. **Admin → Add teacher** to create a teacher account.
3. Register a student at `/register`. The student sees "waiting for approval".
4. **Admin → Student approvals → Approve**.
5. Sign in as the teacher → **My availability → Add availability**.
6. Sign in as the student → **Find a teacher** → pick a slot → **Send request**.
7. As the teacher, open **Requests** → **Approve** or **Reject**. The student sees the new status under **My appointments**.

## Roles and rules

- Public registration only ever creates a **student**; there is no way to register as admin or teacher.
- Unapproved or rejected students get `403 ACCOUNT_NOT_APPROVED` on every protected endpoint except `GET /api/auth/me`.
- Teachers only see and change their own slots and appointments; students only see their own appointments and messages.
- A slot is *available*, *booked* or *blocked*. A rejected or student-cancelled appointment reopens the slot; a teacher-cancelled appointment blocks it so it is not rebooked by accident (reopen it from **My availability**).
- Teachers with upcoming pending/approved appointments cannot be deleted.

## API reference

All responses are JSON: `{ success, message?, data?, pagination? }`; errors are `{ success: false, message, code?, errors? }`. Auth uses the `token` cookie (a `Authorization: Bearer <jwt>` header is also accepted).

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/health` | public | Health and DB status |
| POST | `/api/auth/register` | public, rate-limited | Student registration (pending) |
| POST | `/api/auth/login` | public, rate-limited | Sign in, sets cookie |
| POST | `/api/auth/forgot-password` | public, rate-limited | Body `{ email }`. Always answers 200 with the same message; emails a reset link if the account exists |
| POST | `/api/auth/reset-password` | public, rate-limited | Body `{ token, password }`. Token comes from the emailed link; works once |
| POST | `/api/auth/logout` | any | Clears cookie |
| GET | `/api/auth/me` | signed in | Current user |
| GET | `/api/teachers` | public | Directory. Query: `q`, `department`, `page`, `limit` |
| GET | `/api/teachers/departments` | public | Distinct departments |
| GET | `/api/teachers/:id` | public | Public teacher profile |
| PUT | `/api/users/me` | approved | Update own profile |
| PUT | `/api/users/me/password` | approved | Change own password (other sessions are signed out) |
| GET | `/api/users` | admin | List students/teachers. Query: `role`, `registrationStatus`, `q`, `page` |
| GET | `/api/users/:id` | admin | One user |
| GET | `/api/users/students` | teacher | Approved students (message recipients) |
| POST | `/api/admin/teachers` | admin | Create teacher |
| PUT | `/api/admin/teachers/:id` | admin | Update teacher |
| DELETE | `/api/admin/teachers/:id` | admin | Delete teacher |
| PATCH | `/api/admin/students/:id/status` | admin | Body `{ status: approved\|rejected\|pending }` |
| GET | `/api/availability/teacher/:teacherId` | approved user | Open future slots |
| GET | `/api/availability/mine` | teacher | Own slots. Query: `status`, `from`, `to`, `page` |
| GET | `/api/availability/:id` | teacher | Own slot |
| POST | `/api/availability` | teacher | Create slots `{ date, startTime, endTime, slotDuration, repeatWeeks }` |
| PUT | `/api/availability/:id` | teacher | Edit or block/reopen own slot |
| DELETE | `/api/availability/:id` | teacher | Delete own unbooked slot |
| POST | `/api/appointments` | student | Book `{ availabilityId, purpose, notifyTeacher }` |
| GET | `/api/appointments` | any role | Role-scoped list. Query: `status` (`pending`, `approved`, `completed`, `rejected`, `cancelled`), `q`, `from`, `to`, `upcoming`, `sort`, `page` |
| GET | `/api/appointments/:id` | participant or admin | One appointment |
| PATCH | `/api/appointments/:id/approve` | teacher | Approve a pending request |
| PATCH | `/api/appointments/:id/reject` | teacher | Reject a pending request |
| PATCH | `/api/appointments/:id/cancel` | student, teacher | Cancel with optional/required reason |
| GET | `/api/messages` | student, teacher | `box=inbox\|sent`, `unread`, `page` |
| POST | `/api/messages` | student, teacher | Send `{ recipientId, subject, content, notifyByEmail }` |
| PATCH | `/api/messages/:id/read` | recipient | Mark read |
| GET | `/api/dashboard` | any role | Role-specific statistics |

## Tests

```bash
cd backend
npm test
```

The suite (`backend/tests/api.test.js`) starts an in-memory MongoDB (`mongodb-memory-server`, which downloads a MongoDB binary on first run) and covers: forgot/reset password (no user enumeration, single-use and expired tokens, old sessions signed out), automatic completion of past appointments, registration and role-escalation attempt, password hashing, pending-student blocking, admin-only teacher management, teacher-only availability, overlap rejection, two students racing for one slot (exactly one wins), approval/rejection/cancellation flows, cross-teacher access denial, honest email status and dashboard counts.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `[config] Missing required environment variable` | Create `backend/.env` from `.env.example` and fill it in |
| `MONGODB_URI still contains <PLACEHOLDER>` | Replace every `<…>` in the connection string |
| `Could not connect to MongoDB` / server selection timeout | Add your IP in Atlas **Network Access**; check username/password (URL-encode special characters like `@`, `#`) |
| Browser shows CORS errors | `CORS_ORIGIN` must exactly match the frontend origin (scheme, host, port) |
| Login succeeds but you are signed out on refresh | Cookie not stored. In production over HTTPS set `COOKIE_SECURE=true`; for different domains also `COOKIE_SAME_SITE=none` |
| "Cannot reach the server" toast | Backend not running, or `VITE_API_BASE_URL` is wrong. Restart `npm run dev` after editing `.env` files |
| `Too many attempts` | Auth rate limit hit; wait 15 minutes or raise `AUTH_RATE_LIMIT_MAX` in development |
| Reset link never arrives | Password reset depends on SMTP. Check the backend log for `[mail]` lines and your spam folder; the link is deliberately not logged |
| Reset link says it can't be used | It expired (30 minutes), was already used, or was cut when copied. Request a new one |
| Emails not arriving | Check the backend log for `[mail]`. Gmail needs an app password. The UI toast states whether an email was sent, not configured or failed |
| Slot times appear shifted | Set `TIMEZONE_OFFSET_MINUTES` to your local offset (India: `330`) |
| `bcrypt` fails to install | Use Node 20 LTS, and make sure npm can download prebuilt binaries (or install build tools) |
| Seed: "A student account already uses this email" | Choose a different `ADMIN_EMAIL` |

## Known limitations

- Slot dates use one server-wide timezone offset (`TIMEZONE_OFFSET_MINUTES`); there is no per-user timezone or daylight-saving handling.
- Profile pictures are URLs; there is no file upload.
- Password reset needs SMTP; there is no admin-triggered reset or security-question fallback.
- A pending request whose time has passed is not auto-expired.
- Messages are one-way notes with reply, not real-time chat.
