import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  saveData: (fileName: string, data: string) =>
    ipcRenderer.invoke('save-data', fileName, data),
  loadData: (fileName: string) =>
    ipcRenderer.invoke('load-data', fileName),
  exportGroup: (data: string) =>
    ipcRenderer.invoke('export-group', data),
  selectImage: () =>
    ipcRenderer.invoke('select-image'),
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
} catch (e) {
  // contextIsolation=false 时 contextBridge 会抛错，直接挂到 window
  (window as any).electronAPI = electronAPI;
}

// contextIsolation=false 时双保险，再直接挂一次
if (!(window as any).electronAPI) {
  (window as any).electronAPI = electronAPI;
}
