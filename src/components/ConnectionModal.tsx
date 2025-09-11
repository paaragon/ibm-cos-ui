import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Connection } from '../types';

interface ConnectionModalProps {
  connection?: Connection | null;
  onSave: (connection: Omit<Connection, 'id'>) => void;
  onCancel: () => void;
}

export function ConnectionModal({ connection, onSave, onCancel }: ConnectionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    endpoint: '',
    apiKey: '',
    instanceId: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (connection) {
      setFormData({
        name: connection.name,
        endpoint: connection.endpoint,
        apiKey: connection.apiKey,
        instanceId: connection.instanceId,
        isDefault: connection.isDefault || false,
      });
    } else {
      setFormData({
        name: '',
        endpoint: '',
        apiKey: '',
        instanceId: '',
        isDefault: false,
      });
    }
  }, [connection]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Connection name is required';
    }

    if (!formData.endpoint.trim()) {
      newErrors.endpoint = 'Endpoint URL is required';
    } else {
      try {
        new URL(formData.endpoint);
      } catch {
        newErrors.endpoint = 'Please enter a valid URL';
      }
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = 'API Key is required';
    }

    if (!formData.instanceId.trim()) {
      newErrors.instanceId = 'Service Instance ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {connection ? 'Edit Connection' : 'New Connection'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Connection Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              className={errors.name ? 'input-error' : 'input'}
              placeholder="My IBM COS Connection"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint URL
            </label>
            <input
              id="endpoint"
              type="url"
              value={formData.endpoint}
              onChange={handleChange('endpoint')}
              className={errors.endpoint ? 'input-error' : 'input'}
              placeholder="https://s3.us-south.cloud-object-storage.appdomain.cloud"
            />
            {errors.endpoint && (
              <p className="mt-1 text-sm text-red-600">{errors.endpoint}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Your IBM COS service endpoint URL
            </p>
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={handleChange('apiKey')}
              className={errors.apiKey ? 'input-error' : 'input'}
              placeholder="Your IBM Cloud API Key"
            />
            {errors.apiKey && (
              <p className="mt-1 text-sm text-red-600">{errors.apiKey}</p>
            )}
          </div>

          <div>
            <label htmlFor="instanceId" className="block text-sm font-medium text-gray-700 mb-1">
              Service Instance ID
            </label>
            <input
              id="instanceId"
              type="text"
              value={formData.instanceId}
              onChange={handleChange('instanceId')}
              className={errors.instanceId ? 'input-error' : 'input'}
              placeholder="crn:v1:bluemix:public:cloud-object-storage:..."
            />
            {errors.instanceId && (
              <p className="mt-1 text-sm text-red-600">{errors.instanceId}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Your COS service instance CRN
            </p>
          </div>

          <div className="flex items-center">
            <input
              id="isDefault"
              type="checkbox"
              checked={formData.isDefault}
              onChange={handleChange('isDefault')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
              Set as default connection
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {connection ? 'Update' : 'Create'} Connection
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}