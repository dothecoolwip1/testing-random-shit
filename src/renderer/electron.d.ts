import type { SimulatorRunResult } from "../shared/domain";

declare global {
  interface Window {
    cockpit: {
      runSimulator(): Promise<SimulatorRunResult>;
    };
  }
}

export {};
