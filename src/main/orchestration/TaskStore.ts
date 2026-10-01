import type { Task } from "../../shared/domain.js";

export interface TaskStore {
  save(task: Task): Promise<void>;
  get(taskId: string): Promise<Task | null>;
}

export class InMemoryTaskStore implements TaskStore {
  private readonly tasks = new Map<string, Task>();

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, structuredClone(task));
  }

  async get(taskId: string): Promise<Task | null> {
    const task = this.tasks.get(taskId);
    return task ? structuredClone(task) : null;
  }
}
