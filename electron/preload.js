const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('termpro', {
  getPathForFile: (file) => {
    try { return webUtils?.getPathForFile?.(file) || file?.path || null; } catch { return null; }
  },
  createSession: (opts) => ipcRenderer.invoke('term:create', opts),
  sendInput: (id, data) => ipcRenderer.send('term:input', { id, data }),
  resize: (id, cols, rows) => ipcRenderer.send('term:resize', { id, cols, rows }),
  kill: (id) => ipcRenderer.send('term:kill', { id }),
  onData: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on('term:data', handler);
    return () => ipcRenderer.removeListener('term:data', handler);
  },
  onExit: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on('term:exit', handler);
    return () => ipcRenderer.removeListener('term:exit', handler);
  },
  onNotify: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on('term:notify', handler);
    return () => ipcRenderer.removeListener('term:notify', handler);
  },
  saveImage: (base64, ext) => ipcRenderer.invoke('image:save', { base64, ext }),
  decomposeProject: (description, cwd, conversation) => ipcRenderer.invoke('project:decompose', { description, cwd, conversation }),
  saveProjectReport: (targetDir, slug, markdown) => ipcRenderer.invoke('project:saveReport', { targetDir, slug, markdown }),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  detectShells: () => ipcRenderer.invoke('shell:detect')
});
