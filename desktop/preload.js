const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('desktop', { mode: 'electron' });
