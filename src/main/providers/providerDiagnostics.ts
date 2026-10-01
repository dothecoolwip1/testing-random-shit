import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import type {
  ProviderDiagnostic,
  ProviderDiagnosticsResult,
  ProviderId,
  ProviderLaunchResult,
} from "../../shared/providers.js";

const execFileAsync = promisify(execFile);

interface ProviderDefinition {
  id: ProviderId;
  displayName: string;
  command: string;
}

const PROVIDERS: ProviderDefinition[] = [
  { id: "codex", displayName: "OpenAI Codex", command: "codex" },
  { id: "claude", displayName: "Claude Code", command: "claude" },
  { id: "antigravity", displayName: "Google Antigravity", command: "agy" },
];

function definitionFor(providerId: ProviderId): ProviderDefinition {
  const provider = PROVIDERS.find((item) => item.id === providerId);
  if (!provider) {
    throw new Error(`Unsupported provider: ${providerId}`);
  }
  return provider;
}

async function run(
  file: string,
  args: string[],
  timeout = 5000,
): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(file, args, {
      windowsHide: true,
      timeout,
      maxBuffer: 1024 * 1024,
      encoding: "utf8",
    });

    return {
      code: 0,
      stdout: String(stdout ?? "").trim(),
      stderr: String(stderr ?? "").trim(),
    };
  } catch (cause) {
    const error = cause as NodeJS.ErrnoException & {
      code?: string | number;
      stdout?: string;
      stderr?: string;
    };

    return {
      code: typeof error.code === "number" ? error.code : 1,
      stdout: String(error.stdout ?? "").trim(),
      stderr: String(error.stderr ?? error.message ?? "").trim(),
    };
  }
}

async function findExecutable(command: string): Promise<string | undefined> {
  if (process.platform === "win32") {
    const result = await run("where.exe", [command], 3000);
    if (result.code !== 0 || !result.stdout) return undefined;
    return result.stdout.split(/\r?\n/).find(Boolean)?.trim();
  }

  const result = await run("which", [command], 3000);
  if (result.code !== 0 || !result.stdout) return undefined;
  return result.stdout.split(/\r?\n/).find(Boolean)?.trim();
}

async function detectCodexAuth(
  command: string,
): Promise<Pick<ProviderDiagnostic, "authStatus" | "authDetail">> {
  const status = await run(command, ["login", "status"], 5000);
  const combined = `${status.stdout}\n${status.stderr}`.trim();

  if (status.code === 0) {
    return {
      authStatus: "authenticated",
      authDetail: combined || "Codex reports an active login.",
    };
  }

  if (/not logged|not signed|login required|unauth/i.test(combined)) {
    return {
      authStatus: "not-authenticated",
      authDetail: combined || "Codex requires sign-in.",
    };
  }

  return {
    authStatus: "unknown",
    authDetail:
      combined ||
      "Installed, but this Codex version did not expose a conclusive login status.",
  };
}

async function inspectProvider(
  definition: ProviderDefinition,
): Promise<ProviderDiagnostic> {
  const executablePath = await findExecutable(definition.command);

  if (!executablePath) {
    return {
      ...definition,
      installed: false,
      helpAvailable: false,
      authStatus: "unknown",
    };
  }

  const versionResult = await run(definition.command, ["--version"]);
  const helpResult = await run(definition.command, ["--help"]);

  const base: ProviderDiagnostic = {
    ...definition,
    installed: true,
    executablePath,
    version:
      versionResult.stdout.split(/\r?\n/).find(Boolean) ??
      versionResult.stderr.split(/\r?\n/).find(Boolean) ??
      "Installed",
    helpAvailable: helpResult.code === 0 || Boolean(helpResult.stdout),
    authStatus: "unknown",
  };

  if (definition.id === "codex") {
    return {
      ...base,
      ...(await detectCodexAuth(definition.command)),
    };
  }

  return {
    ...base,
    authDetail:
      "Authentication is handled by the provider's official interactive client. Open it to sign in, then run diagnostics again.",
  };
}

export async function runProviderDiagnostics(): Promise<ProviderDiagnosticsResult> {
  const providers: ProviderDiagnostic[] = [];

  for (const definition of PROVIDERS) {
    providers.push(await inspectProvider(definition));
  }

  return {
    checkedAt: new Date().toISOString(),
    providers,
  };
}

function terminalScript(provider: ProviderDefinition): string {
  const title = `AI Coding Cockpit - ${provider.displayName}`;

  return [
    `$Host.UI.RawUI.WindowTitle = '${title.replaceAll("'", "''")}'`,
    "Write-Host ''",
    `Write-Host 'Opening ${provider.displayName}. Complete the provider\'s official sign-in flow if prompted.' -ForegroundColor Cyan`,
    "Write-Host ''",
    provider.command,
  ].join("; ");
}

export async function openProviderLogin(
  providerId: ProviderId,
): Promise<ProviderLaunchResult> {
  const provider = definitionFor(providerId);
  const executablePath = await findExecutable(provider.command);

  if (!executablePath) {
    return {
      providerId,
      started: false,
      message: `${provider.displayName} is not installed or is not available on PATH.`,
    };
  }

  if (process.platform !== "win32") {
    return {
      providerId,
      started: false,
      message:
        "Interactive provider launch is currently implemented for Windows only.",
    };
  }

  const child = spawn(
    "powershell.exe",
    [
      "-NoLogo",
      "-NoExit",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      terminalScript(provider),
    ],
    {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    },
  );

  child.unref();

  return {
    providerId,
    started: true,
    message: `Opened ${provider.displayName} in a separate terminal. Complete its official sign-in flow, then run diagnostics again.`,
  };
}
