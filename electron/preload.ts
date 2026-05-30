import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  importCalendar: () => ipcRenderer.invoke("import-calendar"),
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  getCalendars: () => ipcRenderer.invoke("get-calendars"),
  getGoogleCalendars: () => ipcRenderer.invoke("get-google-calendars"),
  connectGoogleCalendar: (clientId?: string, clientSecret?: string) => ipcRenderer.invoke("connect-google-calendar", clientId, clientSecret),
  syncGoogleCalendar: () => ipcRenderer.invoke("sync-google-calendar"),
  removeGoogleCalendar: (calendarId: string) => ipcRenderer.invoke("remove-google-calendar", calendarId),

  // You can expose other APTs you need here.
  // ...
})
