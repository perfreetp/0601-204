import type { ElectronAPI } from './global';

export type DesktopAPI = ElectronAPI;

function getAPI(): DesktopAPI | null {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI;
  }
  return null;
}

export const desktop = {
  isDesktop(): boolean {
    return getAPI() !== null;
  },

  async selectImage(): Promise<string | null> {
    const api = getAPI();
    if (!api) {
      const file = await browserSelectImage();
      return file;
    }
    try {
      const result = await api.selectImage();
      return result || null;
    } catch (e) {
      console.error('[desktop] selectImage failed:', e);
      alert('选择图片失败：' + (e as Error).message);
      return null;
    }
  },

  async exportGroup(data: string): Promise<{ success: boolean; path?: string }> {
    const api = getAPI();
    if (!api) {
      browserDownloadJSON(data, `trpg-export-${Date.now()}.json`);
      return { success: true };
    }
    try {
      const result = await api.exportGroup(data);
      if (!result?.success) {
        return { success: false };
      }
      return result;
    } catch (e) {
      console.error('[desktop] exportGroup failed:', e);
      alert('导出失败：' + (e as Error).message);
      return { success: false };
    }
  },

  async saveData(fileName: string, data: string): Promise<{ success: boolean; path?: string }> {
    const api = getAPI();
    if (!api) {
      try {
        localStorage.setItem(fileName, data);
        return { success: true };
      } catch {
        return { success: false };
      }
    }
    try {
      const result = await api.saveData(fileName, data);
      return result || { success: false };
    } catch (e) {
      console.error('[desktop] saveData failed:', e);
      return { success: false };
    }
  },

  async loadData(fileName: string): Promise<string | null> {
    const api = getAPI();
    if (!api) {
      try {
        return localStorage.getItem(fileName);
      } catch {
        return null;
      }
    }
    try {
      const result = await api.loadData(fileName);
      return result ?? null;
    } catch (e) {
      console.error('[desktop] loadData failed:', e);
      return null;
    }
  },
};

function browserSelectImage(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/webp,image/gif';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

function browserDownloadJSON(data: string, filename: string) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
