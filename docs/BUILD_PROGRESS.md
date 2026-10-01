# Build Progress

## Current phase

Phase 1 foundation, with the beginning of the first simulator vertical slice.

## Completed items

Implemented in source:

- strict TypeScript domain model for tasks, criteria, findings, verification, and agent activity
- provider-independent AgentProvider interface
- deterministic built-in SimulatorProvider
- explicit task-state transition table
- bounded repair-cycle handling
- evidence-based completion gate
- initial command risk classifier
- Electron main process configured with context isolation, sandboxing, and no renderer Node integration
- sandbox-compatible CommonJS preload bundle built with esbuild
- preload bridge exposing only the simulator action
- React cockpit shell with sidebar, top status area, timeline, and right-side inspector
- simulator vertical slice that runs architect, builder, reviewer, repair, verification, and READY_FOR_USER gating
- unit test source for orchestration and command policy

## Runtime verification

Verified on Windows by the user:

- npm dependency installation completed
- Vite renderer started successfully
- TypeScript Electron compilation reported 0 errors
- Electron desktop window launched successfully

A runtime issue was then observed: the renderer reported `window.cockpit` as undefined because the sandboxed preload was emitted as ESM JavaScript. The source has now been changed to bundle preload code into `dist-electron/preload/index.cjs` and the BrowserWindow points to that file.

The preload fix still needs to be pulled and verified on the target machine.

## Current work

Verify the CommonJS preload fix and confirm the simulator button completes the deterministic run.

## Known problems

- SQLite persistence is not implemented.
- Provider discovery is not implemented.
- Repository selection is not implemented.
- Git worktree isolation is not implemented.
- Diff viewing is not implemented.
- Real Codex/Claude/Antigravity adapters are not implemented.

## Next steps

1. Pull the preload fix and run `npm.cmd install`.
2. Run `npm.cmd run typecheck`.
3. Run `npm.cmd test`.
4. Run `npm.cmd run build`.
5. Launch with `npm.cmd run dev`.
6. Verify the simulator reaches READY_FOR_USER.
7. Add SQLite persistence.
8. Add repository selection and project inspection.
9. Add Git status safety checks and worktree creation.
10. Probe locally installed Codex and Claude Code versions/help output before implementing one real provider.

## Important architectural decisions

- Roles are separate from providers.
- The orchestrator owns task state transitions.
- Agents exchange structured artifacts instead of unrestricted chat histories.
- Completion requires passing criteria, verification evidence, and no open blocker/high findings.
- Renderer code does not receive arbitrary shell access.
- The Electron sandbox remains enabled; the preload is bundled to CommonJS rather than disabling sandbox security.
- Real provider command syntax will not be hardcoded until local tooling has been inspected.
- No consumer web UI scraping or unofficial authentication will be used.
