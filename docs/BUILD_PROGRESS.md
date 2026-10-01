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
- preload bridge exposing only the simulator action
- React cockpit shell with sidebar, top status area, timeline, and right-side inspector
- simulator vertical slice that runs architect, builder, reviewer, repair, verification, and READY_FOR_USER gating
- unit test source for orchestration and command policy

## Current work

The foundation needs to be installed and run on the target Windows environment so compiler, runtime, and Electron issues can be fixed against the actual machine.

## Known problems

- This commit has not been executed or visually verified on the target machine.
- Dependency versions have not yet been reconciled with the target machine's installed Node version.
- The development Electron launch flow has not been tested on Windows.
- The command policy is intentionally conservative and incomplete.
- The simulator uses in-memory persistence.
- Provider discovery is not implemented.
- Repository selection is not implemented.
- Git worktree isolation is not implemented.

## Next steps

1. Install dependencies and run typecheck.
2. Run Vitest suite.
3. Build Electron main/preload and Vite renderer.
4. Launch the desktop application on Windows and inspect console/runtime errors.
5. Add SQLite with migrations and replace InMemoryTaskStore for persisted tasks.
6. Add repository selection and project inspection.
7. Add Git status safety checks and worktree creation.
8. Probe locally installed Codex and Claude Code versions and help output.
9. Implement one real provider adapter only after local probing.
10. Add diff capture and verification command execution.

## Important architectural decisions

- Roles are separate from providers.
- The orchestrator owns task state transitions.
- Agents exchange structured artifacts instead of unrestricted chat histories.
- Completion requires passing criteria, verification evidence, and no open blocker/high findings.
- Renderer code does not receive arbitrary shell access.
- Real provider command syntax will not be hardcoded until local tooling has been inspected.
- No consumer web UI scraping or unofficial authentication will be used.

## Verification performed

No runtime verification has been performed in this chat environment.

The source has been constructed to be internally coherent, but it must not be described as tested, building, or production-ready until the actual target environment runs:

- `npm install`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run dev`

## First vertical slice target

The first fully verified slice remains:

1. select a local repository
2. create task
3. simulator architect produces criteria
4. simulator builder performs a controlled simulated change
5. verification runs
6. simulator reviewer creates finding
7. repair cycle resolves finding
8. criteria pass
9. diff is shown
10. user approves

This commit implements the orchestration/simulator core and UI proof, but repository selection, real file change simulation, diff display, persistence, and user approval are still outstanding.
