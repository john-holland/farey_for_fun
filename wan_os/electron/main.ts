import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../web/frontend/build/index.html'));
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('add-to-farey', async (_, { url, path, content }) => {
  try {
    const response = await fetch('http://localhost:8000/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        path,
        content: Array.from(new Uint8Array(content)),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add file to FareyFS');
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding to FareyFS:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-directory-structure', async (_, dirPath) => {
  try {
    const { stdout } = await execAsync(`find "${dirPath}" -type f`);
    const files = stdout.split('\n').filter(Boolean);
    
    return files.map(file => ({
      path: file,
      relativePath: path.relative(dirPath, file),
    }));
  } catch (error) {
    console.error('Error getting directory structure:', error);
    return [];
  }
});

ipcMain.handle('read-file', async (_, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath);
    return { success: true, content: Array.from(content) };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
}); 