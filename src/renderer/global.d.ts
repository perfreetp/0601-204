export interface ElectronAPI {
  saveData: (fileName: string, data: string) => Promise<{ success: boolean; path?: string }>;
  loadData: (fileName: string) => Promise<string | null>;
  exportGroup: (data: string) => Promise<{ success: boolean; path?: string }>;
  selectImage: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
