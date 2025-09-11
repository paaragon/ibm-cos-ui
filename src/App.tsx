import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { ConnectionModal } from './components/ConnectionModal';
import { useConnections } from './hooks/useConnections';
import type { Connection, Bucket } from './types';

export function App() {
  const {
    connections,
    activeConnection,
    addConnection,
    updateConnection,
    deleteConnection,
    selectConnection,
  } = useConnections();

  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);

  const handleNewConnection = () => {
    setEditingConnection(null);
    setIsConnectionModalOpen(true);
  };

  const handleEditConnection = (connection: Connection) => {
    setEditingConnection(connection);
    setIsConnectionModalOpen(true);
  };

  const handleSaveConnection = (connectionData: Omit<Connection, 'id'>) => {
    if (editingConnection) {
      updateConnection(editingConnection.id, connectionData);
    } else {
      addConnection(connectionData);
    }
    setIsConnectionModalOpen(false);
    setEditingConnection(null);
  };

  const handleDeleteConnection = (connection: Connection) => {
    deleteConnection(connection.id);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        connections={connections}
        activeConnection={activeConnection}
        selectedBucket={selectedBucket}
        onSelectConnection={selectConnection}
        onSelectBucket={setSelectedBucket}
        onNewConnection={handleNewConnection}
        onEditConnection={handleEditConnection}
        onDeleteConnection={handleDeleteConnection}
      />
      
      <MainContent
        connection={activeConnection}
        selectedBucket={selectedBucket}
        onBucketChange={setSelectedBucket}
      />

      {isConnectionModalOpen && (
        <ConnectionModal
          connection={editingConnection}
          onSave={handleSaveConnection}
          onCancel={() => {
            setIsConnectionModalOpen(false);
            setEditingConnection(null);
          }}
        />
      )}

      <Toaster />
    </div>
  );
}