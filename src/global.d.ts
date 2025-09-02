export {};

declare global {
  interface Window {
    ipcRenderer: {
      on: typeof import('electron')['ipcRenderer']['on'];
      off: typeof import('electron')['ipcRenderer']['off'];
      send: typeof import('electron')['ipcRenderer']['send'];
      invoke: typeof import('electron')['ipcRenderer']['invoke'];
      pickFile: (
        filters?: Electron.FileFilter[]
      ) => Promise<{ filePath: string; data: string } | null>;
      importCalendar: (
        filters?: Electron.FileFilter[]
      ) => Promise<{ filePath: string; data: string } | null>;
      pickAndSaveICS: (
        filters?: Electron.FileFilter[]
      ) => Promise<{ filePath: string; data: string } | null>;
      readFile: () => void;
    };
  }
}