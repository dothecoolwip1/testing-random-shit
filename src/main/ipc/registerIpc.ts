import { BrowserWindow, dialog, ipcMain } from "electron";
import type { ProviderId } from "../../shared/providers.js";
import {
  installProvider,
  openProviderLogin,
  runProviderDiagnostics,
} from "../providers/providerDiagnostics.js";
import { inspectProject } from "../projects/projectInspector.js";
import { runVerticalSlice } from "../simulator/runVerticalSlice.js";

const providerIds = new Set<ProviderId>(["codex", "claude", "antigravity"]);

function assertProviderId(value: unknown): ProviderId {
  if (typeof value !== "string" || !providerIds.has(value as ProviderId)) {
    throw new Error("Invalid provider identifier.");
  }

  return value as ProviderId;
}

export function registerIpc(): void {
  ipcMain.handle("cockpit:run-simulator", async () => runVerticalSlice());

  ipcMain.handle("cockpit:provider-diagnostics", async () => {
    return runProviderDiagnostics();
  });

  ipcMain.handle(
    "cockpit:provider-install",
    async (_event, providerId: unknown) => {
      return installProvider(assertProviderId(providerId));
    },
  );

  ipcMain.handle(
    "cockpit:provider-open-login",
    async (_event, providerId: unknown) => {
      return openProviderLogin(assertProviderId(providerId));
    },
  );

  ipcMain.handle("cockpit:project-select", async (event) => {
    const owner = BrowserWindow.fromWebContents(event.sender);
    const options = {
      title: "Open Git Repository",
      properties: ["openDirectory"] as const,
    };

    const result = owner
      ? await dialog.showOpenDialog(owner, options)
      : await dialog.showOpenDialog(options);

    if (result.canceled || !result.filePaths[0]) {
      return null;
    }

    return inspectProject(result.filePaths[0]);
  });
}
