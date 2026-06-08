import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (fileName: string, data: string) =>
    ipcRenderer.invoke('save-data', fileName, data),
  loadData: (fileName: string) =>
    ipcRenderer.invoke('load-data', fileName),
  exportGroup: (data: string) =>
    ipcRenderer.invoke('export-group', data),
  selectImage: () =>
    ipcRenderer.invoke('select-image'),
});
