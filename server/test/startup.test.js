import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { startRuntime, startupMessage } from '../src/startup.js';

function dependencies(overrides = {}) {
  const calls = [];
  return {
    calls, port: 0, seedOnStart: false,
    connect: async () => 'memory',
    seed: async () => { calls.push('seed'); },
    createServer: () => createServer((_req, res) => res.end('ready')),
    attachSockets: () => ({ close: done => { calls.push('sockets closed'); done(); } }),
    startJob: () => ({ stop: () => { calls.push('job stopped'); } }),
    closeDatabase: async () => { calls.push('database closed'); },
    ...overrides,
  };
}
test('successful startup seeds memory, listens, and closes resources exactly once', async () => {
  const deps = dependencies();
  const runtime = await startRuntime(deps);
  assert.equal(runtime.server.listening, true);
  assert.deepEqual(deps.calls, ['seed']);
  await Promise.all([runtime.shutdown(), runtime.shutdown()]);
  assert.equal(runtime.server.listening, false);
  assert.deepEqual(deps.calls, ['seed', 'job stopped', 'sockets closed', 'database closed']);
});
test('persistent mode with seeding disabled does not seed', async () => {
  const deps = dependencies({ connect: async () => 'persistent' });
  const runtime = await startRuntime(deps);
  await runtime.shutdown();
  assert.equal(deps.calls.includes('seed'), false);
});
test('persistent mode with seeding enabled invokes the idempotent seed', async () => {
  const deps = dependencies({ connect: async () => 'persistent', seedOnStart: true });
  const runtime = await startRuntime(deps);
  await runtime.shutdown();
  assert.equal(deps.calls.filter(call => call === 'seed').length, 1);
});
test('database and seed failures close resources and retain the original cause', async () => {
  for (const stage of ['connect', 'seed']) {
    const cause = new Error('Native database failed');
    const deps = dependencies({ [stage]: async () => { throw cause; } });
    await assert.rejects(startRuntime(deps), error => error.cause === cause);
    assert.deepEqual(deps.calls, ['database closed']);
  }
});
test('a real port collision rejects cleanly instead of crashing with an unhandled event', async () => {
  const occupied = createServer();
  await new Promise(resolve => occupied.listen(0, '0.0.0.0', resolve));
  try {
    const deps = dependencies({ port: occupied.address().port });
    await assert.rejects(startRuntime(deps), error => {
      assert.equal(error.cause.code, 'EADDRINUSE');
      assert.match(startupMessage(error), /Stop the other ShareBite/);
      return true;
    });
    assert.deepEqual(deps.calls, ['seed', 'sockets closed', 'database closed']);
  } finally { await new Promise(resolve => occupied.close(resolve)); }
});
test('diagnostics redact database credentials and explain missing dependencies', () => {
  const message = startupMessage(new Error('Startup failed during database connection.', { cause: new Error('Cannot connect mongodb+srv://name:secret@host/db') }));
  assert.ok(!message.includes('secret'));
  assert.match(message, /MongoDB URI hidden/);
  const missing = Object.assign(new Error('Missing package'), { code: 'ERR_MODULE_NOT_FOUND' });
  assert.match(startupMessage(missing), /npm install/);
});
