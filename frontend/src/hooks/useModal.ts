import { useState, useCallback } from 'react';
import { ModalType } from '../components/Modal';

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
  });

  const showModal = useCallback((config: Omit<ModalState, 'isOpen'>) => {
    setModalState({
      ...config,
      isOpen: true,
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Convenience methods for different modal types
  const showSuccess = useCallback((title: string, message?: string) => {
    showModal({
      type: 'success',
      title,
      message,
    });
  }, [showModal]);

  const showError = useCallback((title: string, message?: string) => {
    showModal({
      type: 'error',
      title,
      message,
    });
  }, [showModal]);

  const showWarning = useCallback((title: string, message?: string) => {
    showModal({
      type: 'warning',
      title,
      message,
    });
  }, [showModal]);

  const showInfo = useCallback((title: string, message?: string) => {
    showModal({
      type: 'info',
      title,
      message,
    });
  }, [showModal]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  ) => {
    showModal({
      type: 'confirm',
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
    });
  }, [showModal]);

  const showDelete = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Delete',
    cancelText = 'Cancel'
  ) => {
    showModal({
      type: 'delete',
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
    });
  }, [showModal]);

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showDelete,
  };
};
