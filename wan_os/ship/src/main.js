const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const si = require('systeminformation');
const Store = require('electron-store');
const marked = require('marked');
const fs = require('fs');
const axios = require('axios');

const store = new Store();

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    
    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();
    setupIpcHandlers();
});

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

function setupIpcHandlers() {
    // Get system information
    ipcMain.handle('get-system-info', async () => {
        const [cpu, mem, os, network] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.osInfo(),
            si.networkInterfaces()
        ]);

        return {
            cpu,
            memory: mem,
            os,
            network
        };
    });

    // Get Dailiance performance metrics
    ipcMain.handle('get-dailiance-metrics', async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/metrics');
            return response.data;
        } catch (error) {
            console.error('Error fetching Dailiance metrics:', error);
            return null;
        }
    });

    // Toggle compute node contribution
    ipcMain.handle('toggle-compute-node', async (event, enabled) => {
        store.set('computeNodeEnabled', enabled);
        if (enabled) {
            store.set('lastActive', new Date().toISOString());
        }
        return { success: true, enabled };
    });

    // Get compute node status
    ipcMain.handle('get-compute-node-status', () => {
        return {
            enabled: store.get('computeNodeEnabled', false),
            lastActive: store.get('lastActive', null)
        };
    });

    // Get release plan documentation
    ipcMain.handle('get-release-plan', () => {
        const releasePlanPath = path.join(__dirname, '../../RELEASE_PLAN.md');
        const content = fs.readFileSync(releasePlanPath, 'utf8');
        return marked.parse(content);
    });
} 