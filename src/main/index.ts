import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerIpc } from "./ipc/registerIpc.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

function createWindow(): void {
  const preloadPath = path.join(currentDir, "../preload/index.cjs");

  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: "#0b0d10",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: preloadPath,
    },
  });

  window.webContents.on("preload-error", (_event, preload, error) => {
    console.error("Cockpit preload failed", { preload, error });
  });

  if (!app.isPackaged) {
    void window.loadURL("http://127.0.0.1:5173");
  } else {
    void window.loadFile(path.join(currentDir, "../../dist/index.html"));
  }
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
