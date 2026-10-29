// Keep lifecycle orchestration independent of MongoDB so failure paths can be tested.
export async function startRuntime({ connect, seed, createServer, attachSockets, startJob, closeDatabase, port, seedOnStart }) {
  let server, io, job, closing;
  const shutdown = () => closing ||= (async () => {
    await job?.stop();
    if (io) await new Promise(resolve => io.close(resolve));
    if (server?.listening) await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections?.();
    });
    await closeDatabase();
  })();
  let stage = 'database connection';
  try {
    const mode = await connect();
    stage = 'demo seeding';
    if (mode === 'memory' || seedOnStart) await seed();
    stage = 'HTTP server setup';
    server = createServer(mode);
    io = attachSockets(server);
    stage = `listening on port ${port}`;
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '0.0.0.0', () => { server.off('error', reject); resolve(); });
    });
    stage = 'expiry scheduler';
    job = startJob();
    return { server, mode, shutdown };
  } catch (cause) {
    try { await shutdown(); } catch { /* Preserve the original startup failure. */ }
    throw new Error(`Startup failed during ${stage}.`, { cause });
  }
}

export function startupMessage(error) {
  const cause = error.cause || error;
  const detail = String(cause.message || cause)
    .replace(/mongodb(?:\+srv)?:\/\/[^\s'"<>]+/gi, '[MongoDB URI hidden]');
  let advice = 'Run npm run dev -w server to inspect the API independently.';
  if (cause.code === 'EADDRINUSE') advice = 'Port is already in use. Stop the other ShareBite/API process, then retry. Do not run two dev servers at once.';
  else if (cause.code === 'ERR_MODULE_NOT_FOUND' || cause.code === 'MODULE_NOT_FOUND') advice = 'Dependencies are missing. Run npm install from the repository root, then retry.';
  else if (/mongo|binary|download|invariant|libcrypto|libssl/i.test(detail) || /database/.test(error.message)) advice = 'MongoDB could not start. Its first run needs internet to download the native binary. Check the error below and OS support, or set MONGO_URI to a reachable MongoDB server. On Windows, keep the checkout outside OneDrive to avoid file locks.';
  return `[ShareBite] ${error.message}\n${advice}\nCause: ${detail}`;
}
