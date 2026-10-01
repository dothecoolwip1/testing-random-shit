export type CommandRisk = "SAFE" | "MODIFYING" | "DESTRUCTIVE" | "EXTERNAL";

export interface CommandAssessment {
  risk: CommandRisk;
  requiresApproval: boolean;
  reason: string;
}

const destructivePatterns = [
  /\brm\s+-rf\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+-[a-z]*f/i,
  /\bdrop\s+(table|database)\b/i,
  /\btruncate\s+table\b/i,
];

const externalPatterns = [
  /\bgit\s+push\b/i,
  /\bnpm\s+publish\b/i,
  /\bvercel\s+(deploy|--prod)\b/i,
];

const modifyingPatterns = [
  /\bnpm\s+(install|i|uninstall)\b/i,
  /\bpnpm\s+(add|remove|install)\b/i,
  /\byarn\s+(add|remove|install)\b/i,
];

export function classifyCommand(command: string): CommandAssessment {
  if (destructivePatterns.some((pattern) => pattern.test(command))) {
    return {
      risk: "DESTRUCTIVE",
      requiresApproval: true,
      reason: "Command can delete or irreversibly modify local state.",
    };
  }
  if (externalPatterns.some((pattern) => pattern.test(command))) {
    return {
      risk: "EXTERNAL",
      requiresApproval: true,
      reason: "Command can modify an external or remote system.",
    };
  }
  if (modifyingPatterns.some((pattern) => pattern.test(command))) {
    return {
      risk: "MODIFYING",
      requiresApproval: true,
      reason: "Command modifies project dependencies or files.",
    };
  }
  return {
    risk: "SAFE",
    requiresApproval: false,
    reason: "No known destructive, external, or dependency-changing operation detected.",
  };
}
