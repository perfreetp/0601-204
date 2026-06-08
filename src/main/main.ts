import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'TRPG Studio - 跑团互动平台',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('save-data', async (_event, fileName: string, data: string) => {
  const userDataPath = app.getPath('userData');
  const filePath = path.join(userDataPath, fileName);
  fs.writeFileSync(filePath, data, 'utf-8');
  return { success: true, path: filePath };
});

ipcMain.handle('load-data', async (_event, fileName: string) => {
  const userDataPath = app.getPath('userData');
  const filePath = path.join(userDataPath, fileName);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return null;
});

ipcMain.handle('export-group', async (_event, data: string) => {
  const result = await dialog.showSaveDialog({
    title: '导出整团回顾',
    defaultPath: `trpg-group-export-${Date.now()}.json`,
    filters: [{ name: 'JSON 文件', extensions: ['json'] }],
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, data, 'utf-8');
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择头像/图片',
    filters: [
      { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
    ],
    properties: ['openFile'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const imageBuffer = fs.readFileSync(result.filePaths[0]);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(result.filePaths[0]).slice(1);
    return `data:image/${ext};base64,${base64}`;
  }
  return null;
});
