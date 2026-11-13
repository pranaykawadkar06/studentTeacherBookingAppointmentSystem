import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  // Make sure unique/partial indexes exist before accepting traffic: they are what
  // guarantees double-booking protection.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
}
