"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
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
  pickAndSaveICS: () => electron.ipcRenderer.invoke("import-calendar"),
  readFile: (filePath) => electron.ipcRenderer.invoke("read-file", filePath),
  readAllICSFiles: () => electron.ipcRenderer.invoke("read-all-ics")
  // You can expose other APTs you need here.
  // ...
});
