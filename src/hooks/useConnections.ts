import { useState, useEffect } from 'react';
import { Connection } from '../types';

const CONNECTIONS_STORAGE_KEY = 'ibm-cos-connections';

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null);

  // Load connections from localStorage on mount
  useEffect(() => {
    const savedConnections = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
    if (savedConnections) {
      try {
        const parsed = JSON.parse(savedConnections) as Connection[];
        setConnections(parsed);
        
        // Set the first default connection as active
        const defaultConn = parsed.find(conn => conn.isDefault) || parsed[0];
        if (defaultConn) {
          setActiveConnection(defaultConn);
        }
      } catch (error) {
        console.error('Failed to parse saved connections:', error);
      }
    }
  }, []);

  // Save connections to localStorage whenever they change
  const saveConnections = (newConnections: Connection[]) => {
    setConnections(newConnections);
    localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(newConnections));
  };

  const addConnection = (connection: Omit<Connection, 'id'>) => {
    const newConnection: Connection = {
      ...connection,
      id: crypto.randomUUID(),
    };

    // If this is the first connection or marked as default, make it default
    const isFirstConnection = connections.length === 0;
    if (isFirstConnection || connection.isDefault) {
      // Remove default from other connections
      const updatedConnections = connections.map(conn => ({ ...conn, isDefault: false }));
      newConnection.isDefault = true;
      saveConnections([...updatedConnections, newConnection]);
      setActiveConnection(newConnection);
    } else {
      saveConnections([...connections, newConnection]);
    }

    return newConnection;
  };

  const updateConnection = (id: string, updates: Partial<Connection>) => {
    const updatedConnections = connections.map(conn => {
      if (conn.id === id) {
        const updated = { ...conn, ...updates };
        
        // If making this connection default, remove default from others
        if (updates.isDefault) {
          setActiveConnection(updated);
        }
        
        return updated;
      }
      
      // Remove default from other connections if we're setting a new default
      if (updates.isDefault) {
        return { ...conn, isDefault: false };
      }
      
      return conn;
    });

    saveConnections(updatedConnections);
  };

  const deleteConnection = (id: string) => {
    const updatedConnections = connections.filter(conn => conn.id !== id);
    saveConnections(updatedConnections);

    // If we deleted the active connection, select a new one
    if (activeConnection?.id === id) {
      const newActive = updatedConnections.find(conn => conn.isDefault) || updatedConnections[0] || null;
      setActiveConnection(newActive);
    }
  };

  const selectConnection = (connection: Connection) => {
    setActiveConnection(connection);
  };

  return {
    connections,
    activeConnection,
    addConnection,
    updateConnection,
    deleteConnection,
    selectConnection,
  };
}