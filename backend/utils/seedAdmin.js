import mongoose from 'mongoose';
import { config } from '../config/env.js';
import User from '../models/User.js';

async function run() {
  const { name, email, password } = config.admin;
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before seeding.');
    process.exit(1);
  }
  if (password.startsWith('replace_with') || password.length < 10) {
    console.error('ADMIN_PASSWORD must be changed from the placeholder and be at least 10 characters.');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await User.init();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(
      existing.role === 'admin'
        ? `Admin already exists (${existing.email}). Nothing to do.`
        : `A ${existing.role} account already uses ${existing.email}. Choose a different ADMIN_EMAIL.`
    );
    await mongoose.disconnect();
    process.exit(existing.role === 'admin' ? 0 : 1);
  }

  await User.create({ name, email, password, role: 'admin', registrationStatus: 'approved' });
  console.log(`Admin created: ${email.toLowerCase()}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(`Seeding failed: ${err.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
