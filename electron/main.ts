import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { CosService } from './cos-service';
import type { Connection, ListObjectsParams } from '../shared/types';

const isDev = process.env.NODE_ENV === 'development';

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private cosService = new CosService();

  constructor() {
    this.initializeApp();
  }

  private initializeApp() {
    app.whenReady().then(() => {
      this.createWindow();
      this.registerIpcHandlers();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'default',
      show: false,
    });

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(join(__dirname, '../dist/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });
  }

  private registerIpcHandlers() {
    // COS Operations
    ipcMain.handle('cos:list-buckets', async (_, connection: Connection) => {
      return this.cosService.listBuckets(connection);
    });

    ipcMain.handle('cos:create-bucket', async (_, connection: Connection, name: string, region?: string) => {
      return this.cosService.createBucket(connection, name, region);
    });

    ipcMain.handle('cos:delete-bucket', async (_, connection: Connection, name: string) => {
      return this.cosService.deleteBucket(connection, name);
    });

    ipcMain.handle('cos:list-objects', async (_, connection: Connection, bucket: string, params?: ListObjectsParams) => {
      return this.cosService.listObjects(connection, bucket, params);
    });

    ipcMain.handle('cos:upload-object', async (_, connection: Connection, bucket: string, key: string, filePath: string) => {
      return this.cosService.uploadObject(connection, bucket, key, filePath);
    });

    ipcMain.handle('cos:download-object', async (_, connection: Connection, bucket: string, key: string, destinationPath?: string) => {
      return this.cosService.downloadObject(connection, bucket, key, destinationPath);
    });

    ipcMain.handle('cos:delete-object', async (_, connection: Connection, bucket: string, key: string) => {
      return this.cosService.deleteObject(connection, bucket, key);
    });

    ipcMain.handle('cos:rename-object', async (_, connection: Connection, bucket: string, fromKey: string, toKey: string) => {
      return this.cosService.renameObject(connection, bucket, fromKey, toKey);
    });

    // Platform-specific dialogs
    ipcMain.handle('platform:show-save-dialog', async () => {
      if (!this.mainWindow) return null;
      
      const result = await dialog.showSaveDialog(this.mainWindow, {
        title: 'Save File',
        filters: [
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      
      return result.canceled ? null : result.filePath;
    });

    ipcMain.handle('platform:show-open-dialog', async () => {
      if (!this.mainWindow) return null;
      
      const result = await dialog.showOpenDialog(this.mainWindow, {
        title: 'Select Files',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      
      return result.canceled ? null : result.filePaths;
    });
  }
}

// Start the app
new ElectronApp();