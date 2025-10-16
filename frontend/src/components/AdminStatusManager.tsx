import React, { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { TicketStatus } from '../types';
import { useModal } from '../hooks/useModal';
import Modal from './Modal';

interface AdminStatusManagerProps {
  currentStatus: TicketStatus;
  onStatusChange: (status: TicketStatus, reason: string) => void;
  isChanging: boolean;
}

const AdminStatusManager: React.FC<AdminStatusManagerProps> = ({
  currentStatus,
  onStatusChange,
  isChanging,
}) => {
  const { modalState, showModal, hideModal, showConfirm, showError } = useModal();
  const [reason, setReason] = useState('');

  // Define status actions based on current status
  const getAvailableActions = () => {
    switch (currentStatus) {
      case 'open':
        return [
          { value: 'processed', label: 'Mark as Processed', icon: CheckCircle, color: 'text-green-600' },
          { value: 'resolved', label: 'Mark as Resolved', icon: CheckCircle, color: 'text-green-600' },
          { value: 'closed', label: 'Close Ticket', icon: CheckCircle, color: 'text-gray-600' },
        ];
      case 'processed':
        return [
          { value: 'resolved', label: 'Mark as Resolved', icon: CheckCircle, color: 'text-green-600' },
          { value: 're-opened', label: 'Reopen Ticket', icon: RotateCcw, color: 'text-orange-600' },
          { value: 'closed', label: 'Close Ticket', icon: CheckCircle, color: 'text-gray-600' },
        ];
      case 'resolved':
        return [
          { value: 're-opened', label: 'Reopen Ticket', icon: RotateCcw, color: 'text-orange-600' },
          { value: 'closed', label: 'Close Ticket', icon: CheckCircle, color: 'text-gray-600' },
        ];
      case 're-opened':
        return [
          { value: 'processed', label: 'Mark as Processed', icon: CheckCircle, color: 'text-green-600' },
          { value: 'resolved', label: 'Mark as Resolved', icon: CheckCircle, color: 'text-green-600' },
          { value: 'closed', label: 'Close Ticket', icon: CheckCircle, color: 'text-gray-600' },
        ];
      case 'closed':
        return [
          { value: 're-opened', label: 'Reopen Ticket', icon: RotateCcw, color: 'text-orange-600' },
        ];
      default:
        return [];
    }
  };

  const availableActions = getAvailableActions();

  const handleActionSelect = (action: string) => {
    setReason('');
    
    // Show confirmation modal
    const actionLabel = availableActions.find(a => a.value === action)?.label || action;
    showConfirm(
      'Confirm Status Change',
      `Are you sure you want to ${actionLabel.toLowerCase()} this ticket?\n\nThis will change the status from "${currentStatus}" to "${action}".`,
      () => {
        // Show reason input modal
        showModal({
          type: 'info',
          title: 'Reason Required',
          message: 'Please provide a reason for this status change:',
          size: 'md',
          onConfirm: () => {
            if (reason.trim()) {
              onStatusChange(action as TicketStatus, reason.trim());
              hideModal();
            } else {
              showError('Error', 'Please provide a reason for the status change.');
            }
          },
          confirmText: 'Change Status',
          cancelText: 'Cancel',
          onCancel: hideModal,
        });
      }
    );
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-50';
      case 'processed': return 'text-yellow-600 bg-yellow-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 're-opened': return 'text-orange-600 bg-orange-50';
      case 'closed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Zap className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Admin Status Management</h3>
        </div>

        {/* Current Status */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(currentStatus)}`}>
              {currentStatus}
            </span>
          </div>
        </div>

        {/* Available Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Available Actions:</h4>
          {availableActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.value}
                onClick={() => handleActionSelect(action.value)}
                disabled={isChanging}
                className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center">
                  <IconComponent className={`w-4 h-4 mr-3 ${action.color}`} />
                  <span className="text-sm font-medium text-gray-900">{action.label}</span>
                </div>
                <span className="text-xs text-gray-500 capitalize">→ {action.value}</span>
              </button>
            );
          })}
        </div>

        {/* Warning */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Admin Override</p>
              <p>This bypasses normal workflow rules. Use only when necessary to correct ticket status.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for reason input */}
      <Modal
        isOpen={modalState.isOpen && modalState.type === 'info'}
        onClose={hideModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        size={modalState.size}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for status change:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you're changing the status..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </Modal>
    </>
  );
};

export default AdminStatusManager;
