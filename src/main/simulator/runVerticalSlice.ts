import { randomUUID } from "node:crypto";
import type { SimulatorRunResult, Task } from "../../shared/domain.js";
import { TaskOrchestrator } from "../orchestration/TaskOrchestrator.js";
import { InMemoryTaskStore } from "../orchestration/TaskStore.js";
import { SimulatorProvider } from "../providers/SimulatorProvider.js";

export async function runVerticalSlice(): Promise<SimulatorRunResult> {
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    projectId: "demo-project",
    request: "Run the first AI Coding Cockpit simulator vertical slice.",
    state: "CREATED",
    createdAt: now,
    updatedAt: now,
    repairCycle: 0,
    maxRepairCycles: 3,
    artifacts: {
      implementationPlan: null,
      acceptanceCriteria: [],
      findings: [],
      verificationResults: [],
    },
  };

  const store = new InMemoryTaskStore();
  const orchestrator = new TaskOrchestrator(store);
  const provider = new SimulatorProvider();
  const timeline: string[] = [];

  await store.save(task);
  await orchestrator.transition(task.id, "GATHERING_CONTEXT");
  timeline.push("Context gathered");

  await orchestrator.transition(task.id, "PLANNING");
  const architect = await provider.startTask({
    taskId: task.id,
    role: "ARCHITECT",
    workingDirectory: ".",
    prompt: task.request,
    contextFiles: [],
  });

  for await (const event of provider.streamEvents(architect.id)) {
    timeline.push(`Architect: ${event.summary}`);
  }

  let current = await store.get(task.id);
  if (!current) throw new Error("Task disappeared during planning");

  current.artifacts.implementationPlan = {
    summary: "Exercise the deterministic architect, builder, reviewer, repair, and verification loop.",
    affectedAreas: ["orchestrator", "provider simulator", "renderer"],
    risks: ["This is simulated and does not modify a real repository."],
    testingRequirements: ["Task transitions remain valid", "All final criteria pass"],
  };

  current.artifacts.acceptanceCriteria = [
    { id: "criterion-1", description: "Architect produces observable acceptance criteria.", status: "UNKNOWN" },
    { id: "criterion-2", description: "Reviewer finding is resolved before readiness.", status: "UNKNOWN" },
    { id: "criterion-3", description: "Verification evidence passes before READY_FOR_USER.", status: "UNKNOWN" },
  ];
  await store.save(current);

  await orchestrator.transition(task.id, "IMPLEMENTING");
  const builder = await provider.startTask({
    taskId: task.id,
    role: "BUILDER",
    workingDirectory: ".",
    prompt: "Perform the simulated implementation.",
    contextFiles: [],
  });
  for await (const event of provider.streamEvents(builder.id)) {
    timeline.push(`Builder: ${event.summary}`);
  }

  await orchestrator.transition(task.id, "VERIFYING");
  current = await store.get(task.id);
  if (!current) throw new Error("Task disappeared during verification");
  current.artifacts.verificationResults.push({
    id: randomUUID(),
    kind: "TEST",
    passed: true,
    summary: "Simulated verification passed.",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  });
  await store.save(current);

  await orchestrator.transition(task.id, "REVIEWING");
  const reviewer = await provider.startTask({
    taskId: task.id,
    role: "REVIEWER",
    workingDirectory: ".",
    prompt: "Review the simulated implementation.",
    contextFiles: [],
  });
  for await (const event of provider.streamEvents(reviewer.id)) {
    timeline.push(`Reviewer: ${event.summary}`);
  }

  current = await store.get(task.id);
  if (!current) throw new Error("Task disappeared during review");
  current.artifacts.findings.push({
    id: "finding-1",
    severity: "HIGH",
    category: "verification",
    description: "Acceptance criteria have not yet been marked with evidence.",
    evidence: ["All criteria are still UNKNOWN."],
    recommendedAction: "Resolve the finding and attach simulator evidence.",
    status: "OPEN",
  });
  await store.save(current);

  await orchestrator.beginRepairCycle(task.id);
  timeline.push("Repair cycle 1 started");

  current = await store.get(task.id);
  if (!current) throw new Error("Task disappeared during repair");
  current.artifacts.findings[0].status = "RESOLVED";
  current.artifacts.acceptanceCriteria = current.artifacts.acceptanceCriteria.map((criterion) => ({
    ...criterion,
    status: "PASS",
    evidence: ["Deterministic simulator evidence"],
  }));
  await store.save(current);

  await orchestrator.transition(task.id, "VERIFYING");
  await orchestrator.transition(task.id, "REVIEWING");
  await orchestrator.transition(task.id, "FINAL_VERIFICATION");

  if (!(await orchestrator.canFinish(task.id))) {
    throw new Error("Simulator failed its own completion gate.");
  }

  await orchestrator.transition(task.id, "READY_FOR_USER");
  timeline.push("All simulated acceptance criteria passed");

  const finalTask = await store.get(task.id);
  if (!finalTask) throw new Error("Task disappeared before completion");
  return { task: finalTask, timeline };
}
