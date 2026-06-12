---
name: Replit SIGABRT thread limit fix
description: How to fix SIGABRT (exit 134) crashes caused by OS thread limit in constrained Replit environments
---

## The problem

In resource-constrained Replit environments, processes crash with SIGABRT (exit code 134) when creating additional OS threads:

1. **esbuild** — spawns a Go binary that needs 8+ OS threads → SIGABRT
2. **esbuild-wasm** — still uses threads internally → SIGABRT  
3. **pino-pretty transport** — uses `thread-stream` (worker threads) → SIGABRT

The crash only happens in the workflow environment (pnpm subprocess), not in bash (fewer background processes at the time).

## Fix applied

### Build tool: switched esbuild → rollup
- rollup is pure JavaScript, no Go binary, no worker threads
- Use `@rollup/plugin-typescript` with `noCheck: true` (skip type-checking, just transpile)
- `build.mjs` uses the rollup Node.js API directly

### Logger: sync pino-pretty
- Add `sync: true` to pino-pretty transport options
- This runs pino-pretty synchronously in the main thread, no worker thread spawned
```ts
transport: {
  target: "pino-pretty",
  options: { colorize: true, sync: true },
}
```

### Workflow: bypass pnpm
- Changed `artifact.toml` `[services.development]` to run `node` directly instead of `pnpm run dev`
- Eliminates one level of process spawning which was enough to push over thread limit
- Set `PORT=8080` and `NODE_ENV=development` in `[services.development.env]`

### Workspace libs: don't bundle them
- `@workspace/api-zod` and `@workspace/db` export TypeScript source directly (no compiled JS)
- Removed the only import of `@workspace/api-zod` from `health.ts` (replaced with inline logic)
- Keep `@workspace/*` as external in rollup (they're not needed at runtime since health.ts was fixed)

**Why:** The OS thread limit (`ulimit -u`) is shared across all processes in the Replit container. Multiple workflows + pnpm subprocesses + Go binaries exhausts the limit.

**How to apply:** Whenever a build tool or Node.js process crashes with exit 134 (SIGABRT) in Replit workflows, check for: Go binaries (esbuild), native thread-creating modules (thread-stream, worker_threads), or too many nested subprocess spawns via pnpm.
