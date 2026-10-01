# AI Coding Cockpit

Windows-first local desktop command center for orchestrating multiple AI coding agents around the same software project.

This repository currently contains the first foundation slice:

- Electron + React + TypeScript + Vite shell
- deterministic task state machine
- provider abstraction
- built-in provider simulator
- structured acceptance criteria and findings
- bounded repair-cycle logic
- command risk classification
- a simulator-driven UI slice
- unit tests for orchestration and command policy
- progress tracking in `docs/BUILD_PROGRESS.md`

## Status

This is an early, unverified foundation commit. It has not yet been run on the target Windows machine, and it does not yet include SQLite persistence, Git worktree execution, real Codex/Claude/Antigravity adapters, terminal sessions, diff viewing, or Playwright browser verification.

Nothing in this repository should be treated as production-ready until it has been installed, typechecked, tested, built, launched, and visually verified on the target environment.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

See `docs/BUILD_PROGRESS.md` for exact implementation status.
