export type TaskState =
  | "CREATED"
  | "GATHERING_CONTEXT"
  | "PLANNING"
  | "AWAITING_APPROVAL"
  | "IMPLEMENTING"
  | "VERIFYING"
  | "REVIEWING"
  | "FIXING"
  | "FINAL_VERIFICATION"
  | "READY_FOR_USER"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type AcceptanceStatus = "UNKNOWN" | "PASS" | "FAIL" | "BLOCKED";
export type FindingSeverity = "BLOCKER" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type AgentRole =
  | "ARCHITECT"
  | "BUILDER"
  | "REVIEWER"
  | "UI_REVIEWER"
  | "TESTER"
  | "RESEARCHER"
  | "DEBUGGER"
  | "SECURITY_REVIEWER";

export interface AcceptanceCriterion {
  id: string;
  description: string;
  status: AcceptanceStatus;
  evidence?: string[];
}

export interface AgentFinding {
  id: string;
  severity: FindingSeverity;
  category: string;
  description: string;
  evidence: string[];
  recommendedAction?: string;
  status: "OPEN" | "RESOLVED" | "WONT_FIX";
}

export interface ImplementationPlan {
  summary: string;
  affectedAreas: string[];
  risks: string[];
  testingRequirements: string[];
}

export interface VerificationResult {
  id: string;
  kind: "BUILD" | "TEST" | "TYPECHECK" | "LINT" | "BROWSER";
  passed: boolean;
  command?: string;
  summary: string;
  startedAt: string;
  completedAt: string;
}

export interface TaskArtifactMap {
  implementationPlan: ImplementationPlan | null;
  acceptanceCriteria: AcceptanceCriterion[];
  findings: AgentFinding[];
  verificationResults: VerificationResult[];
}

export interface Task {
  id: string;
  projectId: string;
  request: string;
  state: TaskState;
  createdAt: string;
  updatedAt: string;
  repairCycle: number;
  maxRepairCycles: number;
  artifacts: TaskArtifactMap;
}

export interface AgentActivityEvent {
  id: string;
  taskId: string;
  providerId: string;
  role: AgentRole;
  type:
    | "STATUS"
    | "MESSAGE"
    | "FILE_CHANGED"
    | "COMMAND_STARTED"
    | "COMMAND_COMPLETED"
    | "ERROR";
  summary: string;
  timestamp: string;
}

export interface SimulatorRunResult {
  task: Task;
  timeline: string[];
}
