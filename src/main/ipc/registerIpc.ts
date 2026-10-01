import { ipcMain } from "electron";
import type { ProviderId } from "../../shared/providers.js";
import {
  openProviderLogin,
  runProviderDiagnostics,
} from "../providers/providerDiagnostics.js";
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
    "cockpit:provider-open-login",
    async (_event, providerId: unknown) => {
      return openProviderLogin(assertProviderId(providerId));
    },
  );
}
