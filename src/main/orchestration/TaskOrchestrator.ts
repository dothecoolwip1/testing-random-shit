import type { Task, TaskState } from "../../shared/domain.js";
import type { TaskStore } from "./TaskStore.js";

const transitions: Record<TaskState, TaskState[]> = {
  CREATED: ["GATHERING_CONTEXT", "CANCELLED", "FAILED"],
  GATHERING_CONTEXT: ["PLANNING", "CANCELLED", "FAILED"],
  PLANNING: ["AWAITING_APPROVAL", "IMPLEMENTING", "CANCELLED", "FAILED"],
  AWAITING_APPROVAL: ["IMPLEMENTING", "CANCELLED"],
  IMPLEMENTING: ["VERIFYING", "CANCELLED", "FAILED"],
  VERIFYING: ["REVIEWING", "FIXING", "FAILED"],
  REVIEWING: ["FIXING", "FINAL_VERIFICATION", "FAILED"],
  FIXING: ["VERIFYING", "FAILED", "CANCELLED"],
  FINAL_VERIFICATION: ["READY_FOR_USER", "FIXING", "FAILED"],
  READY_FOR_USER: ["COMPLETED", "FIXING", "CANCELLED"],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export class TaskOrchestrator {
  constructor(private readonly store: TaskStore) {}

  async transition(taskId: string, target: TaskState): Promise<Task> {
    const task = await this.requireTask(taskId);
    const allowed = transitions[task.state];
    if (!allowed.includes(target)) {
      throw new Error(`Invalid task transition: ${task.state} -> ${target}`);
    }
    task.state = target;
    task.updatedAt = new Date().toISOString();
    await this.store.save(task);
    return task;
  }

  async beginRepairCycle(taskId: string): Promise<Task> {
    const task = await this.requireTask(taskId);
    if (task.repairCycle >= task.maxRepairCycles) {
      throw new Error("Automatic repair cycle limit reached.");
    }
    task.repairCycle += 1;
    await this.store.save(task);
    return this.transition(taskId, "FIXING");
  }

  async canFinish(taskId: string): Promise<boolean> {
    const task = await this.store.get(taskId);
    if (!task) return false;

    const criteriaPassed =
      task.artifacts.acceptanceCriteria.length > 0 &&
      task.artifacts.acceptanceCriteria.every((criterion) => criterion.status === "PASS");

    const verificationPassed =
      task.artifacts.verificationResults.length > 0 &&
      task.artifacts.verificationResults.every((result) => result.passed);

    const blockersRemain = task.artifacts.findings.some(
      (finding) =>
        finding.status === "OPEN" &&
        (finding.severity === "BLOCKER" || finding.severity === "HIGH"),
    );

    return criteriaPassed && verificationPassed && !blockersRemain;
  }

  private async requireTask(taskId: string): Promise<Task> {
    const task = await this.store.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    return task;
  }
}
