import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateBucketModalProps {
  onSave: (name: string, region?: string) => void;
  onCancel: () => void;
}

export function CreateBucketModal({ onSave, onCancel }: CreateBucketModalProps) {
  const [bucketName, setBucketName] = useState('');
  const [region, setRegion] = useState('us-standard');
  const [error, setError] = useState('');

  const regions = [
    { value: 'us-standard', label: 'US Standard' },
    { value: 'us-south', label: 'US South (Dallas)' },
    { value: 'us-east', label: 'US East (Washington DC)' },
    { value: 'eu-gb', label: 'EU Great Britain (London)' },
    { value: 'eu-de', label: 'EU Germany (Frankfurt)' },
    { value: 'jp-tok', label: 'Japan (Tokyo)' },
    { value: 'ap-geo', label: 'Asia Pacific' },
  ];

  const validateBucketName = (name: string) => {
    if (!name.trim()) {
      return 'Bucket name is required';
    }
    
    if (name.length < 3 || name.length > 63) {
      return 'Bucket name must be between 3 and 63 characters';
    }
    
    if (!/^[a-z0-9.-]+$/.test(name)) {
      return 'Bucket name can only contain lowercase letters, numbers, dots, and hyphens';
    }
    
    if (name.startsWith('.') || name.startsWith('-') || name.endsWith('.') || name.endsWith('-')) {
      return 'Bucket name cannot start or end with dots or hyphens';
    }
    
    if (name.includes('..')) {
      return 'Bucket name cannot contain consecutive dots';
    }
    
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateBucketName(bucketName);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onSave(bucketName.trim(), region);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBucketName(value);
    
    if (error) {
      const validationError = validateBucketName(value);
      setError(validationError);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create New Bucket</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="bucketName" className="block text-sm font-medium text-gray-700 mb-1">
              Bucket Name
            </label>
            <input
              id="bucketName"
              type="text"
              value={bucketName}
              onChange={handleNameChange}
              className={error ? 'input-error' : 'input'}
              placeholder="my-bucket-name"
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Must be globally unique, 3-63 characters, lowercase letters, numbers, dots, and hyphens only
            </p>
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="input"
            >
              {regions.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose a region closest to your users for better performance
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={!!error || !bucketName.trim()}>
              Create Bucket
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