import { contextBridge, ipcRenderer } from 'electron';
import type { Connection, ListObjectsParams, CosApi } from '../shared/types';

// Create the typed IPC bridge
const cosApi: CosApi = {
  listBuckets: (connection: Connection) => 
    ipcRenderer.invoke('cos:list-buckets', connection),
    
  createBucket: (connection: Connection, name: string, region?: string) => 
    ipcRenderer.invoke('cos:create-bucket', connection, name, region),
    
  deleteBucket: (connection: Connection, name: string) => 
    ipcRenderer.invoke('cos:delete-bucket', connection, name),
    
  listObjects: (connection: Connection, bucket: string, params?: ListObjectsParams) => 
    ipcRenderer.invoke('cos:list-objects', connection, bucket, params),
    
  uploadObject: (connection: Connection, bucket: string, key: string, filePath: string) => 
    ipcRenderer.invoke('cos:upload-object', connection, bucket, key, filePath),
    
  downloadObject: (connection: Connection, bucket: string, key: string, destinationPath?: string) => 
    ipcRenderer.invoke('cos:download-object', connection, bucket, key, destinationPath),
    
  deleteObject: (connection: Connection, bucket: string, key: string) => 
    ipcRenderer.invoke('cos:delete-object', connection, bucket, key),
    
  renameObject: (connection: Connection, bucket: string, fromKey: string, toKey: string) => 
    ipcRenderer.invoke('cos:rename-object', connection, bucket, fromKey, toKey),
};

const platformApi = {
  showSaveDialog: () => ipcRenderer.invoke('platform:show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('platform:show-open-dialog'),
};

// Expose the APIs to the renderer process
contextBridge.exposeInMainWorld('cos', cosApi);
contextBridge.exposeInMainWorld('platform', platformApi);