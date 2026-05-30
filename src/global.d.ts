export {};

declare global {
  interface Window {
    electronAPI: {
      on: typeof import('electron')['ipcRenderer']['on'];
      off: typeof import('electron')['ipcRenderer']['off'];
      send: typeof import('electron')['ipcRenderer']['send'];
      invoke: typeof import('electron')['ipcRenderer']['invoke'];
      importCalendar: (
        filters?: Electron.FileFilter[]
      ) => Promise<string | null>;
      readFile: (filePath: string) => string;
    };
  }
}