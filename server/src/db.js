import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './config.js';
let memory;
export async function connectDatabase() {
  if (config.mongoUri) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('[ShareBite] Database: configured MongoDB (persistent).');
      return 'persistent';
    } catch {
      console.warn('[ShareBite] Configured MongoDB is unreachable. Falling back to a seeded in-memory database.');
      await mongoose.disconnect();
    }
  }
  memory = await MongoMemoryServer.create({ instance: { dbName: 'sharebite' } });
  await mongoose.connect(memory.getUri());
  console.log('[ShareBite] Database: in-memory MongoDB. Demo data resets when the server stops.');
  return 'memory';
}
export async function closeDatabase() {
  try { await mongoose.disconnect(); } finally { await memory?.stop(); memory = undefined; }
}
