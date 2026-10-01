import type { SimulatorRunResult, Task } from "../shared/domain";

export async function runRendererSimulator(): Promise<SimulatorRunResult> {
  const now = new Date().toISOString();

  const task: Task = {
    id: crypto.randomUUID(),
    projectId: "demo-project",
    request: "Run the first AI Coding Cockpit simulator vertical slice.",
    state: "READY_FOR_USER",
    createdAt: now,
    updatedAt: new Date().toISOString(),
    repairCycle: 1,
    maxRepairCycles: 3,
    artifacts: {
      implementationPlan: {
        summary:
          "Exercise the deterministic architect, builder, reviewer, repair, and verification loop.",
        affectedAreas: ["orchestrator", "provider simulator", "renderer"],
        risks: ["Renderer fallback is simulated and does not modify a real repository."],
        testingRequirements: ["All final criteria pass", "Reviewer finding is resolved"],
      },
      acceptanceCriteria: [
        {
          id: "criterion-1",
          description: "Architect produces observable acceptance criteria.",
          status: "PASS",
          evidence: ["Renderer simulator generated structured criteria."],
        },
        {
          id: "criterion-2",
          description: "Reviewer finding is resolved before readiness.",
          status: "PASS",
          evidence: ["Simulated high-severity finding was resolved in repair cycle 1."],
        },
        {
          id: "criterion-3",
          description: "Verification evidence passes before READY_FOR_USER.",
          status: "PASS",
          evidence: ["Simulated verification completed successfully."],
        },
      ],
      findings: [
        {
          id: "finding-1",
          severity: "HIGH",
          category: "verification",
          description: "Acceptance criteria initially lacked evidence.",
          evidence: ["Criteria began in UNKNOWN state."],
          recommendedAction: "Attach simulator evidence.",
          status: "RESOLVED",
        },
      ],
      verificationResults: [
        {
          id: crypto.randomUUID(),
          kind: "TEST",
          passed: true,
          summary: "Renderer simulator verification passed.",
          startedAt: now,
          completedAt: new Date().toISOString(),
        },
      ],
    },
  };

  return {
    task,
    timeline: [
      "Context gathered",
      "Architect: Inspecting repository structure",
      "Architect: Reading project instructions",
      "Architect: Creating acceptance criteria",
      "Architect: Preparing implementation plan",
      "Builder: Inspecting affected files",
      "Builder: Applying simulated change",
      "Builder: Running simulated verification",
      "Reviewer: Reviewing implementation evidence",
      "Reviewer: Comparing result with acceptance criteria",
      "Reviewer: Creating review findings",
      "Repair cycle 1 started",
      "All simulated acceptance criteria passed",
    ],
  };
}
