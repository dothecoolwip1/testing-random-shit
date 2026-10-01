import { describe, expect, it } from "vitest";
import type { Task } from "../src/shared/domain";
import { TaskOrchestrator } from "../src/main/orchestration/TaskOrchestrator";
import { InMemoryTaskStore } from "../src/main/orchestration/TaskStore";

function makeTask(): Task {
  const now = new Date().toISOString();
  return {
    id: "task-1",
    projectId: "project-1",
    request: "test",
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
}

describe("TaskOrchestrator", () => {
  it("allows valid transitions", async () => {
    const store = new InMemoryTaskStore();
    const orchestrator = new TaskOrchestrator(store);
    await store.save(makeTask());
    const task = await orchestrator.transition("task-1", "GATHERING_CONTEXT");
    expect(task.state).toBe("GATHERING_CONTEXT");
  });

  it("rejects invalid transitions", async () => {
    const store = new InMemoryTaskStore();
    const orchestrator = new TaskOrchestrator(store);
    await store.save(makeTask());
    await expect(orchestrator.transition("task-1", "COMPLETED")).rejects.toThrow(
      "Invalid task transition",
    );
  });

  it("requires evidence and resolved blocking findings before finish", async () => {
    const store = new InMemoryTaskStore();
    const orchestrator = new TaskOrchestrator(store);
    const task = makeTask();

    task.artifacts.acceptanceCriteria = [
      { id: "a", description: "observable", status: "PASS" },
    ];
    task.artifacts.verificationResults = [
      {
        id: "v",
        kind: "TEST",
        passed: true,
        summary: "passed",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    ];
    task.artifacts.findings = [
      {
        id: "f",
        severity: "HIGH",
        category: "test",
        description: "blocking",
        evidence: ["example"],
        status: "OPEN",
      },
    ];

    await store.save(task);
    expect(await orchestrator.canFinish(task.id)).toBe(false);

    task.artifacts.findings[0].status = "RESOLVED";
    await store.save(task);
    expect(await orchestrator.canFinish(task.id)).toBe(true);
  });
});
