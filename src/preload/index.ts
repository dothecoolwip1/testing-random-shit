import { contextBridge, ipcRenderer } from "electron";
import type { SimulatorRunResult } from "../shared/domain.js";

contextBridge.exposeInMainWorld("cockpit", {
  runSimulator: (): Promise<SimulatorRunResult> =>
    ipcRenderer.invoke("cockpit:run-simulator"),
});
