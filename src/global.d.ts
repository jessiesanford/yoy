export {};

declare global {
  interface GoogleCalendarEventPayload {
    id: string;
    title: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    allDay: boolean;
  }

  interface GoogleCalendarPayload {
    id: string;
    name: string;
    color: string;
    events: GoogleCalendarEventPayload[];
  }

  interface Window {
    electronAPI: {
      on: typeof import('electron')['ipcRenderer']['on'];
      off: typeof import('electron')['ipcRenderer']['off'];
      send: typeof import('electron')['ipcRenderer']['send'];
      invoke: typeof import('electron')['ipcRenderer']['invoke'];
      importCalendar: (
        filters?: Electron.FileFilter[]
      ) => Promise<string | null>;
      readFile: (filePath: string) => Promise<string>;
      getCalendars: () => Promise<string[]>;
      getGoogleCalendars: () => Promise<GoogleCalendarPayload[]>;
      connectGoogleCalendar: (clientId?: string, clientSecret?: string) => Promise<GoogleCalendarPayload[]>;
      syncGoogleCalendar: () => Promise<GoogleCalendarPayload[]>;
      removeGoogleCalendar: (calendarId: string) => Promise<GoogleCalendarPayload[]>;
    };
  }
}
