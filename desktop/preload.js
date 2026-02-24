const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  mode: 'electron',
  getConfig: () => ipcRenderer.invoke('desktop:get-config'),
  setConfig: (config) => ipcRenderer.invoke('desktop:set-config', config),
  getDefaultUrl: () => ipcRenderer.invoke('desktop:get-default-url')
});
