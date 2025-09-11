import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface RenameModalProps {
  currentName: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
}

export function RenameModal({ currentName, onSave, onCancel }: RenameModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState('');

  useEffect(() => {
    setNewName(currentName);
  }, [currentName]);

  const validateName = (name: string) => {
    if (!name.trim()) {
      return 'Object name is required';
    }
    
    if (name === currentName) {
      return 'New name must be different from current name';
    }
    
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateName(newName);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onSave(newName.trim());
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewName(value);
    
    if (error) {
      const validationError = validateName(value);
      setError(validationError);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Rename Object</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentName" className="block text-sm font-medium text-gray-700 mb-1">
              Current Name
            </label>
            <input
              id="currentName"
              type="text"
              value={currentName}
              disabled
              className="input bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-1">
              New Name
            </label>
            <input
              id="newName"
              type="text"
              value={newName}
              onChange={handleNameChange}
              className={error ? 'input-error' : 'input'}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={!!error || !newName.trim()}>
              Rename
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