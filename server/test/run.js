import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const serverRoot = fileURLToPath(new URL('../', import.meta.url));
const testFiles = readdirSync(path.join(serverRoot, 'test')).filter(name => name.endsWith('.test.js')).map(name => `test/${name}`);
console.log('[ShareBite tests] Using an isolated in-memory database; configured MONGO_URI is ignored.');
const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  cwd: serverRoot,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'test', MONGO_URI: '' },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
