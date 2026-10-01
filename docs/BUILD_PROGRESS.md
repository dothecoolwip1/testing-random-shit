# Build Progress

## Current phase

Phase 1 foundation moving into real local project and provider discovery.

## Verified on the user's Windows machine

- npm dependencies install successfully after approving required Electron/esbuild install scripts
- Vite renderer starts
- TypeScript Electron compilation reports zero errors on the earlier foundation build
- Electron desktop window launches
- renderer navigation works
- simulator vertical slice runs

## Implemented in source

- strict TypeScript task/artifact domain model
- deterministic orchestrator
- provider-independent provider interface
- built-in simulator
- command risk classifier
- Electron/React/Vite desktop shell
- sidebar navigation
- context-isolated preload API
- native local Git repository picker
- Git root, branch, default branch, origin remote, dirty-state, and changed-file-count inspection
- package-manager detection
- common framework detection
- package.json script discovery
- project instruction-file discovery
- provider diagnostics for Codex, Claude Code, and Google Antigravity
- Windows executable discovery using where.exe
- installed version and help probing
- Codex login status probing
- official interactive provider launch in a separate PowerShell window
- official Windows installer launch for missing Codex, Claude Code, and Antigravity clients
- install-all-missing provider action
- PATH-independent fallback detection for common Windows install locations
- no browser-session scraping and no credential copying

## Provider connection behavior

OpenAI Codex:
- detect local `codex`
- inspect `--version` and `--help`
- inspect `codex login status`
- launch official Codex CLI for ChatGPT sign-in

Claude Code:
- detect local `claude`
- inspect `--version` and `--help`
- launch official Claude Code client for provider-managed sign-in

Google Antigravity:
- detect local `agy`
- inspect `--version` and `--help`
- launch official Antigravity CLI for Google OAuth sign-in

The cockpit does not read or copy credentials from provider storage.

## Electron bridge compatibility

The preload is bundled as CommonJS. The BrowserWindow keeps context isolation enabled and renderer Node integration disabled.

The Chromium sandbox is temporarily disabled because the sandboxed preload did not load on the target Windows environment. The preload API is still explicitly allowlisted and exposes no arbitrary command-execution function.

## Current work

Verify the privileged preload bridge, repository picker, and provider diagnostics on the target Windows machine.

## Next steps

1. Pull and launch the latest build.
2. Confirm lower-left says Electron bridge connected.
3. Open Projects and select a real local repository.
4. Open Agents and run provider diagnostics.
5. Sign in to installed providers through their official clients.
6. Add Git task branch/worktree creation and locking.
7. Add SQLite project/task persistence.
8. Integrate one real provider task execution, starting with the cleanest installed CLI automation surface.
9. Capture Git diff and verification evidence.
10. Require user approval before commit.


## Windows installer launch fix

Provider installer/login terminals now use PowerShell Start-Process with an encoded command instead of a detached Node child process. This explicitly creates a visible console window on Windows and returns launch failures to the cockpit UI instead of silently reporting success.
