import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Upload, 
  RefreshCw, 
  Download,
  Edit3,
  Folder,
  File,
  ArrowLeft,
  Database
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { CreateBucketModal } from './CreateBucketModal';
import { RenameModal } from './RenameModal';
import { ConfirmModal } from './ConfirmModal';
import type { Connection, Bucket, ObjectItem } from '../types';

interface MainContentProps {
  connection: Connection | null;
  selectedBucket: Bucket | null;
  onBucketChange: (bucket: Bucket | null) => void;
}

export function MainContent({ connection, selectedBucket, onBucketChange }: MainContentProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [commonPrefixes, setCommonPrefixes] = useState<string[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateBucketModalOpen, setIsCreateBucketModalOpen] = useState(false);
  const [renameObject, setRenameObject] = useState<ObjectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'bucket' | 'object'; item: Bucket | ObjectItem } | null>(null);
  
  const { showSuccess, showError, showLoading, dismiss } = useNotifications();

  // Load buckets when connection changes
  useEffect(() => {
    if (connection) {
      loadBuckets();
    } else {
      setBuckets([]);
      setObjects([]);
      setCommonPrefixes([]);
    }
  }, [connection]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load objects when bucket changes
  useEffect(() => {
    if (selectedBucket && connection) {
      setCurrentPrefix('');
      setSearchQuery('');
      loadObjects();
    } else {
      setObjects([]);
      setCommonPrefixes([]);
      setCurrentPrefix('');
    }
  }, [selectedBucket, connection]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBuckets = async () => {
    if (!connection) return;

    setIsLoading(true);
    try {
      const result = await window.cos.listBuckets(connection);
      if (result.ok && result.data) {
        setBuckets(result.data);
      } else {
        showError(result.error || 'Failed to load buckets');
      }
    } catch (error) {
      showError('Failed to load buckets');
      console.error('Error loading buckets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadObjects = async (prefix = currentPrefix) => {
    if (!connection || !selectedBucket) return;

    setIsLoading(true);
    const effectivePrefix = searchQuery || prefix;
    
    try {
      const result = await window.cos.listObjects(connection, selectedBucket.name, {
        prefix: effectivePrefix,
        maxKeys: 1000,
      });
      
      if (result.ok && result.data) {
        setObjects(result.data.objects);
        setCommonPrefixes(result.data.commonPrefixes);
      } else {
        showError(result.error || 'Failed to load objects');
      }
    } catch (error) {
      showError('Failed to load objects');
      console.error('Error loading objects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBucket = async (name: string, region?: string) => {
    if (!connection) return;

    const loadingToast = showLoading('Creating bucket...');
    try {
      const result = await window.cos.createBucket(connection, name, region);
      if (result.ok) {
        showSuccess('Bucket created successfully');
        await loadBuckets();
      } else {
        showError(result.error || 'Failed to create bucket');
      }
    } catch (error) {
      showError('Failed to create bucket');
      console.error('Error creating bucket:', error);
    } finally {
      dismiss(loadingToast);
    }
  };

  const handleDeleteBucket = async (bucket: Bucket) => {
    if (!connection) return;

    const loadingToast = showLoading('Deleting bucket...');
    try {
      const result = await window.cos.deleteBucket(connection, bucket.name);
      if (result.ok) {
        showSuccess('Bucket deleted successfully');
        if (selectedBucket?.name === bucket.name) {
          onBucketChange(null);
        }
        await loadBuckets();
      } else {
        showError(result.error || 'Failed to delete bucket');
      }
    } catch (error) {
      showError('Failed to delete bucket');
      console.error('Error deleting bucket:', error);
    } finally {
      dismiss(loadingToast);
    }
  };

  const handleUpload = async () => {
    if (!connection || !selectedBucket) return;

    try {
      const filePaths = await window.platform.showOpenDialog();
      if (!filePaths || filePaths.length === 0) return;

      for (const filePath of filePaths) {
        const fileName = filePath.split('/').pop() || 'unknown';
        const key = currentPrefix + fileName;
        
        const loadingToast = showLoading(`Uploading ${fileName}...`);
        try {
          const result = await window.cos.uploadObject(connection, selectedBucket.name, key, filePath);
          if (result.ok) {
            showSuccess(`${fileName} uploaded successfully`);
          } else {
            showError(`Failed to upload ${fileName}: ${result.error}`);
          }
        } finally {
          dismiss(loadingToast);
        }
      }
      
      await loadObjects();
    } catch (error) {
      showError('Failed to upload files');
      console.error('Error uploading files:', error);
    }
  };

  const handleDownload = async (object: ObjectItem) => {
    if (!connection || !selectedBucket) return;

    try {
      const destinationPath = await window.platform.showSaveDialog();
      if (!destinationPath) return;

      const loadingToast = showLoading(`Downloading ${object.key}...`);
      try {
        const result = await window.cos.downloadObject(
          connection, 
          selectedBucket.name, 
          object.key, 
          destinationPath
        );
        
        if (result.ok) {
          showSuccess('File downloaded successfully');
        } else {
          showError(result.error || 'Failed to download file');
        }
      } finally {
        dismiss(loadingToast);
      }
    } catch (error) {
      showError('Failed to download file');
      console.error('Error downloading file:', error);
    }
  };

  const handleRename = async (object: ObjectItem, newKey: string) => {
    if (!connection || !selectedBucket) return;

    const loadingToast = showLoading('Renaming object...');
    try {
      const result = await window.cos.renameObject(
        connection, 
        selectedBucket.name, 
        object.key, 
        newKey
      );
      
      if (result.ok) {
        showSuccess('Object renamed successfully');
        await loadObjects();
      } else {
        showError(result.error || 'Failed to rename object');
      }
    } catch (error) {
      showError('Failed to rename object');
      console.error('Error renaming object:', error);
    } finally {
      dismiss(loadingToast);
    }
  };

  const handleDeleteObject = async (object: ObjectItem) => {
    if (!connection || !selectedBucket) return;

    const loadingToast = showLoading('Deleting object...');
    try {
      const result = await window.cos.deleteObject(connection, selectedBucket.name, object.key);
      if (result.ok) {
        showSuccess('Object deleted successfully');
        await loadObjects();
      } else {
        showError(result.error || 'Failed to delete object');
      }
    } catch (error) {
      showError('Failed to delete object');
      console.error('Error deleting object:', error);
    } finally {
      dismiss(loadingToast);
    }
  };

  const navigateToPrefix = (prefix: string) => {
    setCurrentPrefix(prefix);
    setSearchQuery('');
    loadObjects(prefix);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadObjects();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!connection) {
    return (
      <div className="main-content flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Connection Selected</h3>
          <p className="text-gray-500">Please select or create a connection to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedBucket ? `Bucket: ${selectedBucket.name}` : 'Buckets'}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadBuckets}
              disabled={isLoading}
              className="btn-secondary"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            {!selectedBucket && (
              <button
                onClick={() => setIsCreateBucketModalOpen(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Bucket
              </button>
            )}
            
            {selectedBucket && (
              <button onClick={handleUpload} className="btn-primary">
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </button>
            )}
          </div>
        </div>

        {/* Navigation and search */}
        {selectedBucket && (
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <button
                onClick={() => onBucketChange(null)}
                className="hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Buckets
              </button>
            </div>
            
            {currentPrefix && (
              <div className="flex items-center text-sm text-gray-600">
                <span>Path:</span>
                <button
                  onClick={() => navigateToPrefix('')}
                  className="ml-2 hover:text-gray-900"
                >
                  {selectedBucket.name}
                </button>
                {currentPrefix.split('/').filter(Boolean).map((part, index, arr) => {
                  const partialPath = arr.slice(0, index + 1).join('/') + '/';
                  return (
                    <span key={index}>
                      <span className="mx-1">/</span>
                      <button
                        onClick={() => navigateToPrefix(partialPath)}
                        className="hover:text-gray-900"
                      >
                        {part}
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search objects..."
                  className="input pl-10 pr-4"
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {!selectedBucket ? (
          // Buckets list
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buckets.map(bucket => (
              <div
                key={bucket.name}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer group"
                onClick={() => onBucketChange(bucket)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <Database className="w-5 h-5 text-blue-500 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {bucket.name}
                      </h3>
                    </div>
                    {bucket.creationDate && (
                      <p className="text-sm text-gray-500">
                        Created: {new Date(bucket.creationDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ type: 'bucket', item: bucket });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
                    title="Delete bucket"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
            
            {buckets.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12">
                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Buckets Found</h3>
                <p className="text-gray-500 mb-4">Create your first bucket to get started.</p>
                <button
                  onClick={() => setIsCreateBucketModalOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bucket
                </button>
              </div>
            )}
          </div>
        ) : (
          // Objects list
          <div>
            {/* Folders (common prefixes) */}
            {commonPrefixes.map(prefix => (
              <div
                key={prefix}
                className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                onClick={() => navigateToPrefix(prefix)}
              >
                <div className="flex items-center">
                  <Folder className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="font-medium">
                    {prefix.replace(currentPrefix, '').replace('/', '')}
                  </span>
                </div>
              </div>
            ))}

            {/* Objects */}
            {objects.map(object => (
              <div
                key={object.key}
                className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <File className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {object.key.replace(currentPrefix, '')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(object.size)} • {new Date(object.lastModified).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(object)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRenameObject(object)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Rename"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: 'object', item: object })}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            {commonPrefixes.length === 0 && objects.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Objects Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 'No objects match your search.' : 'This bucket is empty.'}
                </p>
                {!searchQuery && (
                  <button onClick={handleUpload} className="btn-primary">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateBucketModalOpen && (
        <CreateBucketModal
          onSave={handleCreateBucket}
          onCancel={() => setIsCreateBucketModalOpen(false)}
        />
      )}

      {renameObject && (
        <RenameModal
          currentName={renameObject.key}
          onSave={(newKey) => handleRename(renameObject, newKey)}
          onCancel={() => setRenameObject(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title={`Delete ${deleteTarget.type}`}
          message={`Are you sure you want to delete "${
            deleteTarget.type === 'bucket' 
              ? (deleteTarget.item as Bucket).name 
              : (deleteTarget.item as ObjectItem).key
          }"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={async () => {
            if (deleteTarget.type === 'bucket') {
              await handleDeleteBucket(deleteTarget.item as Bucket);
            } else {
              await handleDeleteObject(deleteTarget.item as ObjectItem);
            }
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}