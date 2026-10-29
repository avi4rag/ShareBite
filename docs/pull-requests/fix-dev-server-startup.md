## Summary
Fix the Windows dev server hang where `npm run dev` would exit with code 4294967295 (or
hang indefinitely) on machines where a previous MongoDB binary download was interrupted.

## Root cause
`mongodb-memory-server` downloads its MongoDB binary to `~/.cache/mongodb-binaries/` on
first run. If the download is interrupted (network loss, OneDrive file lock, force-quit)
it leaves two stale files:
- `mongodb-windows-x86_64-8.2.6.zip.downloading` — the partial zip
- `8.2.6.lock` — a PID/UUID lock file

On every subsequent startup the library sees the lock file, assumes another process owns
the download, and waits indefinitely. `concurrently` then times out, kills both processes,
and exits with code 4294967295 — giving no useful error message.

## Changes
- `server/src/db.js`: scan `~/.cache/mongodb-binaries` before calling
  `MongoMemoryServer.create()` and remove any `*.downloading` / `*.lock` files, with a
  clear log line explaining what was cleaned.
- `server/src/db.js`: log a human-readable "Downloading MongoDB binary…" message so the
  first-run wait is never silent.
- `server/package.json`: add `mongodbMemoryServer.version = "7.0.14"` so the binary
  target is deterministic across machines.

## How to test
1. `npm run dev -w server` — server starts, seeds data, binds port 4000.
2. `GET http://localhost:4000/` → JSON with app name, version, databaseMode.
3. `GET http://localhost:4000/api/health` → `{ status: "ok", databaseConnected: true }`.
4. Manually create a stale `.downloading` file in `~/.cache/mongodb-binaries/`, restart
   the server, verify it is removed and startup continues.

## Checklist
- [x] App runs with no console errors
- [x] Lint/build passes
- [x] API root and /api/health verified (200 OK)
- [x] Stale lock cleanup verified
