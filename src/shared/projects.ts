export interface ProjectInspection {
  name: string;
  repositoryPath: string;
  branch: string;
  defaultBranch?: string;
  remote?: string;
  dirty: boolean;
  changedFileCount: number;
  packageManager?: "npm" | "pnpm" | "yarn" | "bun";
  frameworks: string[];
  scripts: Record<string, string>;
  instructionFiles: string[];
}
