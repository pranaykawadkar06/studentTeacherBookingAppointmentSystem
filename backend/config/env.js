import dotenv from 'dotenv';

dotenv.config();

const env = process.env;

const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !env[key]);
if (missing.length) {
  console.error(
    `\n[config] Missing required environment variable(s): ${missing.join(', ')}.\n` +
      '         Copy backend/.env.example to backend/.env and fill in the values.\n'
  );
  process.exit(1);
}
if (/[<>]/.test(env.MONGODB_URI)) {
  console.error('\n[config] MONGODB_URI still contains <PLACEHOLDER> values. Replace them with your real Atlas details.\n');
  process.exit(1);
}
if (env.JWT_SECRET.length < 16 || env.JWT_SECRET === 'replace_with_a_long_random_secret') {
  console.error('\n[config] JWT_SECRET must be a random string of at least 16 characters (32+ recommended).\n');
  process.exit(1);
}

const toBool = (value, fallback = false) =>
  value === undefined || value === '' ? fallback : String(value).toLowerCase() === 'true';
const toInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

const mailPlaceholder =
  env.MAIL_USER === 'your_email@gmail.com' || env.MAIL_PASS === 'your_email_app_password';

export const config = {
  env: env.NODE_ENV || 'development',
  isProd: env.NODE_ENV === 'production',
  port: toInt(env.PORT, 5000),
  mongoUri: env.MONGODB_URI,
  jwt: { secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN || '1d' },
  clientUrl: env.CLIENT_URL || 'http://localhost:5173',
  corsOrigins: (env.CORS_ORIGIN || env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  cookie: {
    secure: toBool(env.COOKIE_SECURE, false),
    sameSite: ['lax', 'strict', 'none'].includes(env.COOKIE_SAME_SITE) ? env.COOKIE_SAME_SITE : 'lax',
  },
  mail: {
    host: env.MAIL_HOST,
    port: toInt(env.MAIL_PORT, 587),
    secure: toBool(env.MAIL_SECURE, false),
    user: env.MAIL_USER,
    pass: env.MAIL_PASS,
    from: env.MAIL_FROM || env.MAIL_USER,
    enabled: Boolean(env.MAIL_HOST && env.MAIL_USER && env.MAIL_PASS) && !mailPlaceholder,
  },
  admin: { name: env.ADMIN_NAME || 'System Administrator', email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
  tzOffsetMinutes: toInt(env.TIMEZONE_OFFSET_MINUTES, 0),
  cancellationMinHours: Math.max(toInt(env.CANCELLATION_MIN_HOURS, 2), 0),
  authRateLimitMax: toInt(env.AUTH_RATE_LIMIT_MAX, 20),
  trustProxy: toBool(env.TRUST_PROXY, false),
};
