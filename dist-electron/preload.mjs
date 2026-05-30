"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  },
  importCalendar: () => electron.ipcRenderer.invoke("import-calendar"),
  readFile: (filePath) => electron.ipcRenderer.invoke("read-file", filePath),
  getCalendars: () => electron.ipcRenderer.invoke("get-calendars"),
  getGoogleCalendars: () => electron.ipcRenderer.invoke("get-google-calendars"),
  connectGoogleCalendar: (clientId, clientSecret) => electron.ipcRenderer.invoke("connect-google-calendar", clientId, clientSecret),
  syncGoogleCalendar: () => electron.ipcRenderer.invoke("sync-google-calendar"),
  removeGoogleCalendar: (calendarId) => electron.ipcRenderer.invoke("remove-google-calendar", calendarId)
  // You can expose other APTs you need here.
  // ...
});
