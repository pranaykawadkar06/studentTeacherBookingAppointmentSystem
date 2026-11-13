import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { logMailStatus } from './services/emailService.js';
import { startCompletionJob } from './services/appointmentLifecycle.js';
import app from './app.js';

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`[db] Could not connect to MongoDB: ${err.message}`);
    console.error('     Check MONGODB_URI, your Atlas user/password, and that your IP is allowed in Atlas Network Access.');
    process.exit(1);
  }
  logMailStatus();
  const stopCompletionJob = startCompletionJob();
  const server = app.listen(config.port, () => console.log(`[server] Listening on http://localhost:${config.port} (${config.env})`));

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    stopCompletionJob();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (err) => console.error('[server] Unhandled rejection:', err));
start();
