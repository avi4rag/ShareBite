import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';

const memory = await MongoMemoryServer.create({ instance: { dbName: 'sharebite-production-check' } });
const socket = createServer();
await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));

const child = spawn(process.execPath, ['server/src/index.js'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    MONGO_URI: memory.getUri(),
    JWT_SECRET: randomBytes(48).toString('hex'),
    CLIENT_URL: 'https://sharebite-anurag.vercel.app,http://localhost:5173',
    SEED_ON_START: 'true',
    DEMO_MODE: 'true',
  },
});
let logs = '';
child.stdout.on('data', data => { logs += data.toString(); });
child.stderr.on('data', data => { logs += data.toString(); });
const base = `http://127.0.0.1:${port}`;
const expectedJson = async path => {
  const response = await fetch(`${base}${path}`);
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error(`${path} returned non-JSON (${response.status})`);
  return { response, data: await response.json() };
};
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) throw new Error(`Production server exited early. ${logs}`);
    try { const { response } = await expectedJson('/api/health'); if (response.ok) { ready = true; break; } }
    catch { /* Wait for the isolated seed and server startup. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error(`Production server did not become ready. ${logs}`);
  for (const path of ['/', '/api/health', '/api/listings', '/api/stats', '/api/leaderboard']) {
    const { response, data } = await expectedJson(path);
    if (!response.ok) throw new Error(`${path} returned ${response.status}: ${JSON.stringify(data)}`);
    if (path === '/api/listings' && (!Array.isArray(data) || data.length < 20)) throw new Error('Production seed did not produce the discovery feed.');
    console.log(`${path}: ${response.status} JSON`);
  }
  for (const email of ['donor@demo.com', 'ngo@demo.com', 'admin@demo.com']) {
    const response = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Demo@1234' }) });
    const data = await response.json();
    if (!response.ok || !data.token || data.user?.passwordHash) throw new Error(`Demo login failed for ${email}: ${response.status}`);
    console.log(`${email}: signed in`);
  }
  const unknown = await expectedJson('/api/does-not-exist');
  if (unknown.response.status !== 404 || !unknown.data.message) throw new Error('Unknown API route did not return JSON 404.');
  const cors = await fetch(`${base}/api/health`, { headers: { Origin: 'https://sharebite-anurag.vercel.app' } });
  if (cors.headers.get('access-control-allow-origin') !== 'https://sharebite-anurag.vercel.app') throw new Error('Production CORS origin is not allowed.');
  console.log('Production API, seed, logins, JSON 404, and Vercel CORS passed against isolated MongoDB.');
} finally {
  child.kill('SIGTERM');
  await new Promise(resolve => { if (child.exitCode !== null) resolve(); else child.once('exit', resolve); });
  await memory.stop();
}
