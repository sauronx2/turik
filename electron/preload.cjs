const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getLocalIP: () => ipcRenderer.invoke('get-local-ip'),
    startDevServer: () => ipcRenderer.invoke('start-dev-server'),
    stopDevServer: () => ipcRenderer.invoke('stop-dev-server'),
    getServerStatus: () => ipcRenderer.invoke('get-server-status')
});

