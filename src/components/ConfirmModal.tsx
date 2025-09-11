import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">{message}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onConfirm} className="btn-danger flex-1">
            {confirmText}
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}