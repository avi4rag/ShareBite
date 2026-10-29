import { startRuntime, startupMessage } from './startup.js';

try {
  // Dynamic imports let configuration and missing-dependency errors use the same diagnostics.
  const { createApp } = await import('./app.js');
  const { connectDatabase, closeDatabase } = await import('./db.js');
  const { config } = await import('./config.js');
  const { seedDatabase } = await import('./seed.js');
  const { createServer } = await import('node:http');
  const { attachSockets } = await import('./socket.js');
  const { startExpiryJob } = await import('./expiry.js');
  const runtime = await startRuntime({
    connect: connectDatabase, seed: seedDatabase,
    createServer: mode => createServer(createApp(mode)),
    attachSockets, startJob: startExpiryJob, closeDatabase,
    port: config.port, demo: config.demo,
  });
  console.log(`[ShareBite] API ready: http://localhost:${config.port} (${runtime.mode} database)`);
  console.log('[ShareBite] Open the app at http://localhost:5173. Health: /api/health');
  let stopping = false;
  async function stop() {
    if (stopping) return;
    stopping = true;
    // Bound shutdown if an OS process or socket refuses to close.
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    try { await runtime.shutdown(); process.exitCode = 0; }
    catch (error) { console.error('[ShareBite] Shutdown failed:', error.message); process.exitCode = 1; }
    finally { clearTimeout(timeout); }
  }
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} catch (error) {
  console.error(startupMessage(error));
  process.exitCode = 1;
}
