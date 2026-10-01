import { ipcMain } from "electron";
import { runVerticalSlice } from "../simulator/runVerticalSlice.js";

export function registerIpc(): void {
  ipcMain.handle("cockpit:run-simulator", async () => runVerticalSlice());
}
