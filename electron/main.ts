import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
    width: 1200,   // default width
    height: 800,   // default height
    minWidth: 900, // optional
    minHeight: 600, // optional
    // autoHideMenuBar: true
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
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
    filters: [{ name: "Calendar Files", extensions: ["ics"] }],
  });

  if (canceled || filePaths.length === 0) return null;

  const filePath = filePaths[0];

  // Ensure Calendars subdirectory exists
  const calendarsDir = path.join(app.getPath("userData"), "Calendars");
  if (!fs.existsSync(calendarsDir)) {
    fs.mkdirSync(calendarsDir, { recursive: true });
  }

  // Save the file in Calendars directory
  const destPath = path.join(calendarsDir, "calendar.ics");
  fs.copyFileSync(filePath, destPath);

  return destPath;
});

ipcMain.handle("read-file", (_e, filePath: string) => fs.readFileSync(filePath, "utf-8"));

ipcMain.handle("read-all-ics", () => {
  const calendarsDir = path.join(app.getPath("userData"), "Calendars");
  if (!fs.existsSync(calendarsDir)) return [];
  const files = fs.readdirSync(calendarsDir).filter((f) => f.endsWith(".ics"));
  return files.map((f) => fs.readFileSync(path.join(calendarsDir, f), "utf-8"));
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
