const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  saveFile: (name, content) => ipcRenderer.invoke('save-file', name, content)
});
