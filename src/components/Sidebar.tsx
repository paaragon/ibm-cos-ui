import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Database, 
  ChevronRight, 
  ChevronDown,
  RefreshCw 
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import type { Connection, Bucket } from '../types';

interface SidebarProps {
  connections: Connection[];
  activeConnection: Connection | null;
  selectedBucket: Bucket | null;
  onSelectConnection: (connection: Connection) => void;
  onSelectBucket: (bucket: Bucket | null) => void;
  onNewConnection: () => void;
  onEditConnection: (connection: Connection) => void;
  onDeleteConnection: (connection: Connection) => void;
}

export function Sidebar({
  connections,
  activeConnection,
  selectedBucket,
  onSelectConnection,
  onSelectBucket,
  onNewConnection,
  onEditConnection,
  onDeleteConnection,
}: SidebarProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(false);
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set());
  const { showError, showLoading, dismiss } = useNotifications();

  // Load buckets when active connection changes
  useEffect(() => {
    if (activeConnection) {
      loadBuckets();
      setExpandedConnections(prev => new Set([...prev, activeConnection.id]));
    } else {
      setBuckets([]);
    }
  }, [activeConnection]);

  const loadBuckets = async () => {
    if (!activeConnection) return;

    setIsLoadingBuckets(true);
    const loadingToast = showLoading('Loading buckets...');

    try {
      const result = await window.cos.listBuckets(activeConnection);
      if (result.ok && result.data) {
        setBuckets(result.data);
      } else {
        showError(result.error || 'Failed to load buckets');
      }
    } catch (error) {
      showError('Failed to load buckets');
      console.error('Error loading buckets:', error);
    } finally {
      setIsLoadingBuckets(false);
      dismiss(loadingToast);
    }
  };

  const toggleConnectionExpanded = (connectionId: string) => {
    const newExpanded = new Set(expandedConnections);
    if (newExpanded.has(connectionId)) {
      newExpanded.delete(connectionId);
    } else {
      newExpanded.add(connectionId);
    }
    setExpandedConnections(newExpanded);
  };

  const handleConnectionSelect = (connection: Connection) => {
    onSelectConnection(connection);
    if (!expandedConnections.has(connection.id)) {
      toggleConnectionExpanded(connection.id);
    }
  };

  const handleBucketSelect = (bucket: Bucket) => {
    onSelectBucket(selectedBucket?.name === bucket.name ? null : bucket);
  };

  const handleDeleteConnection = (connection: Connection, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete the connection "${connection.name}"?`)) {
      onDeleteConnection(connection);
    }
  };

  const handleEditConnection = (connection: Connection, event: React.MouseEvent) => {
    event.stopPropagation();
    onEditConnection(connection);
  };

  return (
    <div className="sidebar">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">IBM COS UI</h1>
          <button
            onClick={onNewConnection}
            className="btn-primary text-sm"
            title="Add new connection"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700">Connections</h2>
          </div>
          
          {connections.length === 0 ? (
            <p className="text-sm text-gray-500">No connections configured</p>
          ) : (
            <div className="space-y-1">
              {connections.map(connection => (
                <div key={connection.id} className="group">
                  <div
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                      activeConnection?.id === connection.id 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleConnectionSelect(connection)}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <button
                        className="p-0.5 hover:bg-gray-200 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleConnectionExpanded(connection.id);
                        }}
                      >
                        {expandedConnections.has(connection.id) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                      
                      <Database className="w-4 h-4 ml-2 mr-2 flex-shrink-0" />
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{connection.name}</p>
                        {connection.isDefault && (
                          <p className="text-xs text-gray-500">Default</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditConnection(connection, e)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Edit connection"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConnection(connection, e)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Delete connection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Buckets list */}
                  {expandedConnections.has(connection.id) && activeConnection?.id === connection.id && (
                    <div className="ml-6 mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Buckets</span>
                        <button
                          onClick={loadBuckets}
                          disabled={isLoadingBuckets}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                          title="Refresh buckets"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingBuckets ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      
                      {isLoadingBuckets ? (
                        <div className="text-xs text-gray-500 py-2">Loading...</div>
                      ) : buckets.length === 0 ? (
                        <div className="text-xs text-gray-500 py-2">No buckets found</div>
                      ) : (
                        <div className="space-y-1">
                          {buckets.map(bucket => (
                            <button
                              key={bucket.name}
                              onClick={() => handleBucketSelect(bucket)}
                              className={`block w-full text-left p-2 text-xs rounded transition-colors ${
                                selectedBucket?.name === bucket.name
                                  ? 'bg-primary-100 text-primary-800'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <div className="truncate">{bucket.name}</div>
                              {bucket.creationDate && (
                                <div className="text-gray-500 mt-0.5">
                                  {new Date(bucket.creationDate).toLocaleDateString()}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}