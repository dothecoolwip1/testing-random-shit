import { execFile, spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
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
  installCommand: string;
}

const PROVIDERS: ProviderDefinition[] = [
  {
    id: "codex",
    displayName: "OpenAI Codex",
    command: "codex",
    installCommand: "npm.cmd install -g @openai/codex@latest",
  },
  {
    id: "claude",
    displayName: "Claude Code",
    command: "claude",
    installCommand: "irm https://claude.ai/install.ps1 | iex",
  },
  {
    id: "antigravity",
    displayName: "Google Antigravity",
    command: "agy",
    installCommand: "irm https://antigravity.google/cli/install.ps1 | iex",
  },
];

function definitionFor(providerId: ProviderId): ProviderDefinition {
  const provider = PROVIDERS.find((item) => item.id === providerId);
  if (!provider) throw new Error(`Unsupported provider: ${providerId}`);
  return provider;
}

function quotePowerShell(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
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
    const error = cause as {
      code?: string | number;
      stdout?: string;
      stderr?: string;
      message?: string;
    };

    return {
      code: typeof error.code === "number" ? error.code : 1,
      stdout: String(error.stdout ?? "").trim(),
      stderr: String(error.stderr ?? error.message ?? "").trim(),
    };
  }
}

async function canAccess(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function knownWindowsCandidates(providerId: ProviderId): string[] {
  const userProfile = process.env.USERPROFILE ?? "";
  const appData = process.env.APPDATA ?? "";

  switch (providerId) {
    case "codex":
      return [
        path.join(appData, "npm", "codex.cmd"),
        path.join(appData, "npm", "codex.exe"),
      ];
    case "claude":
      return [
        path.join(userProfile, ".local", "bin", "claude.exe"),
        path.join(userProfile, ".local", "bin", "claude.cmd"),
      ];
    case "antigravity":
      return [
        path.join(userProfile, ".local", "bin", "agy.exe"),
        path.join(userProfile, ".local", "bin", "agy.cmd"),
      ];
  }
}

async function findExecutable(
  provider: ProviderDefinition,
): Promise<string | undefined> {
  const lookupCommand = process.platform === "win32" ? "where.exe" : "which";
  const result = await run(lookupCommand, [provider.command], 3000);

  if (result.code === 0 && result.stdout) {
    return result.stdout.split(/\r?\n/).find(Boolean)?.trim();
  }

  if (process.platform === "win32") {
    for (const candidate of knownWindowsCandidates(provider.id)) {
      if (candidate && (await canAccess(candidate))) {
        return candidate;
      }
    }
  }

  return undefined;
}

async function runProviderCommand(
  executablePath: string,
  args: string[],
  timeout = 5000,
): Promise<{ code: number; stdout: string; stderr: string }> {
  if (
    process.platform === "win32" &&
    /\.(cmd|bat)$/i.test(executablePath)
  ) {
    const script = [
      "&",
      quotePowerShell(executablePath),
      ...args.map(quotePowerShell),
    ].join(" ");

    return run(
      "powershell.exe",
      ["-NoLogo", "-NoProfile", "-Command", script],
      timeout,
    );
  }

  return run(executablePath, args, timeout);
}

async function detectCodexAuth(
  executablePath: string,
): Promise<Pick<ProviderDiagnostic, "authStatus" | "authDetail">> {
  const status = await runProviderCommand(
    executablePath,
    ["login", "status"],
    6000,
  );
  const combined = `${status.stdout}\n${status.stderr}`.trim();

  if (status.code === 0) {
    return {
      authStatus: "authenticated",
      authDetail: combined || "Codex reports an active ChatGPT login.",
    };
  }

  if (/not logged|not signed|login required|unauth/i.test(combined)) {
    return {
      authStatus: "not-authenticated",
      authDetail: combined || "Codex requires ChatGPT sign-in.",
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
  const executablePath = await findExecutable(definition);

  if (!executablePath) {
    return {
      id: definition.id,
      displayName: definition.displayName,
      command: definition.command,
      installed: false,
      helpAvailable: false,
      authStatus: "unknown",
    };
  }

  const versionResult = await runProviderCommand(
    executablePath,
    ["--version"],
    6000,
  );
  const helpResult = await runProviderCommand(
    executablePath,
    ["--help"],
    6000,
  );

  const base: ProviderDiagnostic = {
    id: definition.id,
    displayName: definition.displayName,
    command: definition.command,
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
      ...(await detectCodexAuth(executablePath)),
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

function launchPowerShell(
  title: string,
  body: string[],
): void {
  const script = [
    `$Host.UI.RawUI.WindowTitle = ${quotePowerShell(title)}`,
    "Write-Host ''",
    ...body,
  ].join("; ");

  const child = spawn(
    "powershell.exe",
    [
      "-NoLogo",
      "-NoExit",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      script,
    ],
    {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    },
  );

  child.unref();
}

export async function installProvider(
  providerId: ProviderId,
): Promise<ProviderLaunchResult> {
  const provider = definitionFor(providerId);

  if (process.platform !== "win32") {
    return {
      providerId,
      started: false,
      message: "Provider installation is currently implemented for Windows only.",
    };
  }

  const existing = await findExecutable(provider);
  if (existing) {
    return {
      providerId,
      started: false,
      message: `${provider.displayName} is already installed. Run diagnostics or open it to sign in.`,
    };
  }

  launchPowerShell(
    `AI Coding Cockpit - Install ${provider.displayName}`,
    [
      `Write-Host 'Installing ${provider.displayName} using the provider\'s official Windows installation method.' -ForegroundColor Cyan`,
      "Write-Host ''",
      provider.installCommand,
      "Write-Host ''",
      `Write-Host 'Installation command finished. Leave this window open if the installer requests input.' -ForegroundColor Green`,
      `Write-Host 'Return to AI Coding Cockpit and click Run diagnostics again.' -ForegroundColor Green`,
    ],
  );

  return {
    providerId,
    started: true,
    message: `Opened the official ${provider.displayName} installer in PowerShell. Complete any prompts, then run diagnostics again.`,
  };
}

export async function openProviderLogin(
  providerId: ProviderId,
): Promise<ProviderLaunchResult> {
  const provider = definitionFor(providerId);
  const executablePath = await findExecutable(provider);

  if (!executablePath) {
    return {
      providerId,
      started: false,
      message: `${provider.displayName} is not installed. Install it first.`,
    };
  }

  if (process.platform !== "win32") {
    return {
      providerId,
      started: false,
      message: "Interactive provider launch is currently implemented for Windows only.",
    };
  }

  launchPowerShell(
    `AI Coding Cockpit - ${provider.displayName}`,
    [
      `Write-Host 'Opening ${provider.displayName}. Complete the official provider sign-in flow if prompted.' -ForegroundColor Cyan`,
      "Write-Host ''",
      `& ${quotePowerShell(executablePath)}`,
    ],
  );

  return {
    providerId,
    started: true,
    message: `Opened ${provider.displayName}. Complete its official sign-in flow, then run diagnostics again.`,
  };
}
