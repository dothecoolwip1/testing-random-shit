export type ProviderId = "codex" | "claude" | "antigravity";

export type ProviderAuthStatus =
  | "authenticated"
  | "not-authenticated"
  | "unknown";

export interface ProviderDiagnostic {
  id: ProviderId;
  displayName: string;
  command: string;
  installed: boolean;
  executablePath?: string;
  version?: string;
  helpAvailable: boolean;
  authStatus: ProviderAuthStatus;
  authDetail?: string;
  error?: string;
}

export interface ProviderDiagnosticsResult {
  checkedAt: string;
  providers: ProviderDiagnostic[];
}

export interface ProviderLaunchResult {
  providerId: ProviderId;
  started: boolean;
  message: string;
}
