# Build Progress

## Current phase

Phase 1 foundation moving into provider discovery and account connection.

## Verified on the user's Windows machine

- npm dependencies install successfully after approving required Electron/esbuild install scripts
- Vite renderer starts
- TypeScript Electron compilation reports zero errors
- Electron desktop window launches
- renderer navigation works
- simulator vertical slice runs in fallback mode

## Implemented in source

- strict TypeScript task/artifact domain model
- deterministic orchestrator
- provider-independent provider interface
- built-in simulator
- command risk classifier
- Electron/React/Vite desktop shell
- sidebar navigation
- secure context-isolated preload API
- provider diagnostics for Codex, Claude Code, and Google Antigravity
- Windows executable discovery using where.exe
- installed version and help probing
- Codex login status probing
- official interactive provider launch in a separate PowerShell window
- no browser-session scraping and no token copying
- renderer fallback remains limited to non-privileged simulation

## Provider connection behavior

OpenAI Codex:
- detect the local `codex` executable
- inspect `--version` and `--help`
- inspect `codex login status`
- launch the official Codex CLI for ChatGPT sign-in

Claude Code:
- detect the local `claude` executable
- inspect `--version` and `--help`
- launch the official Claude Code client for provider-managed sign-in

Google Antigravity:
- detect the local `agy` executable
- inspect `--version` and `--help`
- launch the official Antigravity CLI for Google OAuth sign-in

The cockpit does not read or copy credentials from provider storage.

## Electron bridge compatibility

The preload is bundled as CommonJS. The BrowserWindow keeps:
- context isolation enabled
- renderer Node integration disabled

The Chromium sandbox is temporarily disabled because the sandboxed preload did not load on the target Windows environment. The exposed preload surface remains explicitly allowlisted and contains no arbitrary shell command API.

Provider IDs are validated before any launch action. The main process chooses fixed commands and does not concatenate user input into shell commands.

## Current work

Verify the privileged preload bridge and provider diagnostics on the target Windows machine.

## Next steps

1. Pull and launch the provider diagnostics build.
2. Confirm the lower-left status says Electron bridge connected.
3. Open Agents and run provider diagnostics.
4. Complete official provider sign-in where needed.
5. Add local repository picker and repository inspection.
6. Add Git dirty-tree checks and isolated task worktrees.
7. Add persisted SQLite project/task storage.
8. Integrate one real provider task execution, starting with whichever installed CLI exposes the cleanest supported automation surface.
9. Capture Git diff and project verification evidence.
10. Add user approval before commit.
