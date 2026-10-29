import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
export const root = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: path.join(root, '.env') });
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in production.');
const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
export const config = {
  port,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || randomBytes(48).toString('hex'),
  demo: process.env.DEMO_MODE === 'true' || (process.env.NODE_ENV !== 'production' && process.env.DEMO_MODE !== 'false'),
  origins: [process.env.CLIENT_ORIGIN || 'http://localhost:5173', 'http://127.0.0.1:5173'],
};
