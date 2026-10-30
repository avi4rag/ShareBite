import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './config.js';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/**
 * Remove stale ".downloading" lock files left by interrupted MongoDB binary
 * downloads.  mongodb-memory-server will not retry a download while these
 * files exist, causing the process to hang indefinitely.
 */
function clearStaleLocks() {
  const cacheDir = join(homedir(), '.cache', 'mongodb-binaries');
  if (!existsSync(cacheDir)) return;
  let removed = 0;
  for (const name of readdirSync(cacheDir)) {
    if (name.endsWith('.downloading') || name.endsWith('.lock')) {
      try {
        rmSync(join(cacheDir, name), { force: true });
        removed++;
      } catch {
        // Non-fatal: the file may be held by another process.
      }
    }
  }
  if (removed > 0) {
    console.log(
      `[ShareBite] Cleaned ${removed} stale MongoDB download file(s). ` +
      'The binary will re-download on first start (requires internet).'
    );
  }
}

let memory;

export async function connectDatabase() {
  if (config.production && !config.mongoUri) {
    console.error('[ShareBite] PRODUCTION DATABASE MISSING: set MONGO_URI to a persistent MongoDB connection. In-memory MongoDB is only for local development.');
    throw new Error('MONGO_URI is required in production.');
  }
  if (config.mongoUri) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('[ShareBite] Database: configured MongoDB (persistent).');
      return 'persistent';
    } catch (error) {
      if (config.production) {
        console.error('[ShareBite] PRODUCTION DATABASE UNREACHABLE: check MongoDB Atlas access and MONGO_URI. In-memory fallback is disabled in production.');
        throw error;
      }
      console.warn(
        '[ShareBite] Configured MongoDB is unreachable. ' +
        'Falling back to a seeded in-memory database.'
      );
      await mongoose.disconnect();
    }
  }

  // Clear any stale download lock files before attempting to start the
  // in-memory server so that a previously interrupted download does not
  // cause the process to hang.
  clearStaleLocks();

  console.log(
    '[ShareBite] Starting in-memory MongoDB (first run downloads ~70 MB binary)…'
  );
  memory = await MongoMemoryServer.create({ instance: { dbName: 'sharebite' } });
  await mongoose.connect(memory.getUri());
  console.log('[ShareBite] Database: in-memory MongoDB. Demo data resets when the server stops.');
  return 'memory';
}

export async function closeDatabase() {
  try { await mongoose.disconnect(); } finally { await memory?.stop(); memory = undefined; }
}
