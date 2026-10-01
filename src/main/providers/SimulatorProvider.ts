import { randomUUID } from "node:crypto";
import type { AgentActivityEvent } from "../../shared/domain.js";
import type {
  AgentProvider,
  AgentSession,
  AgentTaskResult,
  ProviderModel,
  ProviderStatus,
  StartTaskRequest,
} from "./AgentProvider.js";

interface SimulatorSession extends AgentSession {
  role: StartTaskRequest["role"];
  request: StartTaskRequest;
  cancelled: boolean;
}

export class SimulatorProvider implements AgentProvider {
  readonly id = "simulator";
  readonly displayName = "Provider Simulator";
  private readonly sessions = new Map<string, SimulatorSession>();

  async initialize(): Promise<void> {}

  async detectInstallation(): Promise<ProviderStatus> {
    return { installed: true, authenticated: true, available: true, version: "built-in" };
  }

  async detectAuthentication(): Promise<ProviderStatus> {
    return this.detectInstallation();
  }

  async getAvailableModels(): Promise<ProviderModel[]> {
    return [{ id: "simulator-default", displayName: "Deterministic Simulator" }];
  }

  async startTask(request: StartTaskRequest): Promise<AgentSession> {
    const session: SimulatorSession = {
      id: randomUUID(),
      providerId: this.id,
      taskId: request.taskId,
      startedAt: new Date().toISOString(),
      role: request.role,
      request,
      cancelled: false,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async continueTask(sessionId: string, prompt: string): Promise<AgentTaskResult> {
    const session = this.requireSession(sessionId);
    if (session.cancelled) {
      return { sessionId, success: false, summary: "Simulator session was cancelled." };
    }
    return { sessionId, success: true, summary: `Simulator processed follow-up: ${prompt}` };
  }

  async cancelTask(sessionId: string): Promise<void> {
    this.requireSession(sessionId).cancelled = true;
  }

  async *streamEvents(sessionId: string): AsyncIterable<AgentActivityEvent> {
    const session = this.requireSession(sessionId);
    for (const summary of this.eventsForRole(session.role)) {
      if (session.cancelled) return;
      yield {
        id: randomUUID(),
        taskId: session.taskId,
        providerId: this.id,
        role: session.role,
        type: "STATUS",
        summary,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getUsageInformation(): Promise<null> {
    return null;
  }

  async getSessionInformation(sessionId: string): Promise<AgentSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  private requireSession(sessionId: string): SimulatorSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Unknown simulator session: ${sessionId}`);
    return session;
  }

  private eventsForRole(role: StartTaskRequest["role"]): string[] {
    switch (role) {
      case "ARCHITECT":
        return [
          "Inspecting repository structure",
          "Reading project instructions",
          "Creating acceptance criteria",
          "Preparing implementation plan",
        ];
      case "BUILDER":
        return [
          "Inspecting affected files",
          "Applying simulated change",
          "Running simulated verification",
        ];
      case "REVIEWER":
        return [
          "Reviewing implementation evidence",
          "Comparing result with acceptance criteria",
          "Creating review findings",
        ];
      default:
        return [`Running simulated ${role.toLowerCase()} workflow`];
    }
  }
}
