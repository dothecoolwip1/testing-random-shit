import type { AgentActivityEvent, AgentRole } from "../../shared/domain.js";

export interface ProviderStatus {
  installed: boolean;
  authenticated: boolean;
  available: boolean;
  command?: string;
  version?: string;
  reason?: string;
}

export interface ProviderModel {
  id: string;
  displayName: string;
}

export interface StartTaskRequest {
  taskId: string;
  role: AgentRole;
  workingDirectory: string;
  prompt: string;
  contextFiles: string[];
}

export interface AgentSession {
  id: string;
  providerId: string;
  taskId: string;
  startedAt: string;
}

export interface AgentTaskResult {
  sessionId: string;
  success: boolean;
  summary: string;
  structuredOutput?: unknown;
}

export interface AgentProvider {
  readonly id: string;
  readonly displayName: string;

  initialize(): Promise<void>;
  detectInstallation(): Promise<ProviderStatus>;
  detectAuthentication(): Promise<ProviderStatus>;
  getAvailableModels(): Promise<ProviderModel[]>;
  startTask(request: StartTaskRequest): Promise<AgentSession>;
  continueTask(sessionId: string, prompt: string): Promise<AgentTaskResult>;
  cancelTask(sessionId: string): Promise<void>;
  streamEvents(sessionId: string): AsyncIterable<AgentActivityEvent>;
  getUsageInformation(): Promise<unknown | null>;
  getSessionInformation(sessionId: string): Promise<AgentSession | null>;
}
