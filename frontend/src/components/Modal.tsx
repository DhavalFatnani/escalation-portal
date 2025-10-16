import React, { ReactNode } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Trash2, Edit, Eye } from 'lucide-react';

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'delete' | 'edit' | 'view';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ModalType;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  size = 'md',
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    const iconClass = "w-6 h-6";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-600`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-600`} />;
      case 'confirm':
        return <AlertCircle className={`${iconClass} text-blue-600`} />;
      case 'delete':
        return <Trash2 className={`${iconClass} text-red-600`} />;
      case 'edit':
        return <Edit className={`${iconClass} text-blue-600`} />;
      case 'view':
        return <Eye className={`${iconClass} text-gray-600`} />;
      default:
        return <Info className={`${iconClass} text-blue-600`} />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'success':
        return {
          confirm: 'bg-green-600 hover:bg-green-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
      case 'error':
        return {
          confirm: 'bg-red-600 hover:bg-red-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
      case 'warning':
        return {
          confirm: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
      case 'delete':
        return {
          confirm: 'bg-red-600 hover:bg-red-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
      default:
        return {
          confirm: 'bg-blue-600 hover:bg-blue-700 text-white',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      default:
        return 'max-w-lg';
    }
  };

  const buttonStyles = getButtonStyles();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative w-full ${getSizeClasses()} transform rounded-2xl bg-white p-6 shadow-2xl transition-all animate-modal-in`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="mb-6">
            {message && (
              <p className="text-gray-600 leading-relaxed">{message}</p>
            )}
            {children}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                onClick={handleCancel}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${buttonStyles.cancel}`}
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${buttonStyles.confirm}`}
              >
                {confirmText}
              </button>
            )}
            {!onConfirm && !onCancel && (
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${buttonStyles.confirm}`}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
