import { contextBridge, ipcRenderer } from "electron";
import type { SimulatorRunResult } from "../shared/domain.js";
import type { ProjectInspection } from "../shared/projects.js";
import type {
  ProviderDiagnosticsResult,
  ProviderId,
  ProviderLaunchResult,
} from "../shared/providers.js";

contextBridge.exposeInMainWorld("cockpit", {
  runSimulator: (): Promise<SimulatorRunResult> =>
    ipcRenderer.invoke("cockpit:run-simulator"),

  runProviderDiagnostics: (): Promise<ProviderDiagnosticsResult> =>
    ipcRenderer.invoke("cockpit:provider-diagnostics"),

  openProviderLogin: (providerId: ProviderId): Promise<ProviderLaunchResult> =>
    ipcRenderer.invoke("cockpit:provider-open-login", providerId),

  selectProject: (): Promise<ProjectInspection | null> =>
    ipcRenderer.invoke("cockpit:project-select"),
});
