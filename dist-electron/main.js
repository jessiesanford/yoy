import { ipcMain, dialog, app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    },
    width: 1200,
    // default width
    height: 800,
    // default height
    minWidth: 900,
    // optional
    minHeight: 600
    // optional
    // autoHideMenuBar: true
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
ipcMain.handle("pick-file", async () => {
  if (win) {
    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: "Calendar Files", extensions: ["ics"] }],
      properties: ["openFile"]
    });
    if (result.canceled) return null;
    const filePath = result.filePaths[0];
    const data = fs.readFileSync(filePath, "utf-8");
    return { filePath, data };
  }
});
ipcMain.handle("import-calendar", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Calendar Files", extensions: ["ics"] }]
  });
  if (canceled || filePaths.length === 0) return null;
  const filePath = filePaths[0];
  const calendarsDir = path.join(app.getPath("userData"), "Calendars");
  if (!fs.existsSync(calendarsDir)) {
    fs.mkdirSync(calendarsDir, { recursive: true });
  }
  const destPath = path.join(calendarsDir, "calendar.ics");
  fs.copyFileSync(filePath, destPath);
  return destPath;
});
ipcMain.handle("read-file", (_e, filePath) => fs.readFileSync(filePath, "utf-8"));
ipcMain.handle("read-all-ics", () => {
  const calendarsDir = path.join(app.getPath("userData"), "Calendars");
  if (!fs.existsSync(calendarsDir)) return [];
  const files = fs.readdirSync(calendarsDir).filter((f) => f.endsWith(".ics"));
  return files.map((f) => fs.readFileSync(path.join(calendarsDir, f), "utf-8"));
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
