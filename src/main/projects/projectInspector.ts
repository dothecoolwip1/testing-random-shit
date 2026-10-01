import { execFile } from "node:child_process";
import { access, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { ProjectInspection } from "../../shared/projects.js";

const execFileAsync = promisify(execFile);

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function git(
  cwd: string,
  args: string[],
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd,
      windowsHide: true,
      timeout: 8000,
      maxBuffer: 1024 * 1024,
      encoding: "utf8",
    });

    return {
      ok: true,
      stdout: String(stdout ?? "").trim(),
      stderr: String(stderr ?? "").trim(),
    };
  } catch (cause) {
    const error = cause as {
      stdout?: string;
      stderr?: string;
      message?: string;
    };

    return {
      ok: false,
      stdout: String(error.stdout ?? "").trim(),
      stderr: String(error.stderr ?? error.message ?? "").trim(),
    };
  }
}

async function detectPackageManager(
  root: string,
): Promise<ProjectInspection["packageManager"]> {
  if (await exists(path.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (await exists(path.join(root, "yarn.lock"))) return "yarn";
  if (
    (await exists(path.join(root, "bun.lockb"))) ||
    (await exists(path.join(root, "bun.lock")))
  ) {
    return "bun";
  }
  if (await exists(path.join(root, "package-lock.json"))) return "npm";
  return undefined;
}

async function readPackageJson(root: string): Promise<{
  scripts: Record<string, string>;
  dependencies: Set<string>;
}> {
  const packagePath = path.join(root, "package.json");

  if (!(await exists(packagePath))) {
    return { scripts: {}, dependencies: new Set<string>() };
  }

  try {
    const parsed = JSON.parse(await readFile(packagePath, "utf8")) as {
      scripts?: Record<string, unknown>;
      dependencies?: Record<string, unknown>;
      devDependencies?: Record<string, unknown>;
    };

    const scripts = Object.fromEntries(
      Object.entries(parsed.scripts ?? {})
        .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );

    const dependencies = new Set([
      ...Object.keys(parsed.dependencies ?? {}),
      ...Object.keys(parsed.devDependencies ?? {}),
    ]);

    return { scripts, dependencies };
  } catch {
    return { scripts: {}, dependencies: new Set<string>() };
  }
}

async function detectFrameworks(
  root: string,
  dependencies: Set<string>,
): Promise<string[]> {
  const frameworks = new Set<string>();

  const dependencyMap: Array<[string, string]> = [
    ["react", "React"],
    ["vite", "Vite"],
    ["next", "Next.js"],
    ["electron", "Electron"],
    ["typescript", "TypeScript"],
    ["@supabase/supabase-js", "Supabase"],
    ["@capacitor/core", "Capacitor"],
  ];

  for (const [dependency, label] of dependencyMap) {
    if (dependencies.has(dependency)) frameworks.add(label);
  }

  if (
    (await exists(path.join(root, "pyproject.toml"))) ||
    (await exists(path.join(root, "requirements.txt")))
  ) {
    frameworks.add("Python");
  }

  return [...frameworks];
}

async function detectInstructionFiles(root: string): Promise<string[]> {
  const candidates = [
    "AGENTS.md",
    "CLAUDE.md",
    "README.md",
    "CONTRIBUTING.md",
    "docs/ARCHITECTURE.md",
    "docs/DEVELOPMENT.md",
    "docs/BUILD_PROGRESS.md",
  ];

  const found: string[] = [];

  for (const relativePath of candidates) {
    if (await exists(path.join(root, relativePath))) {
      found.push(relativePath.replaceAll("\\", "/"));
    }
  }

  return found;
}

export async function inspectProject(selectedPath: string): Promise<ProjectInspection> {
  const requestedPath = await realpath(selectedPath);
  const rootResult = await git(requestedPath, ["rev-parse", "--show-toplevel"]);

  if (!rootResult.ok || !rootResult.stdout) {
    throw new Error("The selected folder is not inside a Git repository.");
  }

  const repositoryPath = await realpath(rootResult.stdout);
  const branchResult = await git(repositoryPath, ["branch", "--show-current"]);
  const remoteResult = await git(repositoryPath, ["remote", "get-url", "origin"]);
  const defaultBranchResult = await git(repositoryPath, [
    "symbolic-ref",
    "--short",
    "refs/remotes/origin/HEAD",
  ]);
  const statusResult = await git(repositoryPath, ["status", "--porcelain"]);

  const changedLines = statusResult.stdout
    ? statusResult.stdout.split(/\r?\n/).filter(Boolean)
    : [];

  const { scripts, dependencies } = await readPackageJson(repositoryPath);
  const packageManager = await detectPackageManager(repositoryPath);
  const frameworks = await detectFrameworks(repositoryPath, dependencies);
  const instructionFiles = await detectInstructionFiles(repositoryPath);

  return {
    name: path.basename(repositoryPath),
    repositoryPath,
    branch: branchResult.stdout || "(detached HEAD)",
    defaultBranch: defaultBranchResult.ok
      ? defaultBranchResult.stdout.replace(/^origin\//, "")
      : undefined,
    remote: remoteResult.ok ? remoteResult.stdout : undefined,
    dirty: changedLines.length > 0,
    changedFileCount: changedLines.length,
    packageManager,
    frameworks,
    scripts,
    instructionFiles,
  };
}
