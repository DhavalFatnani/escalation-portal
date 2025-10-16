import React, { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle, RotateCcw, X } from 'lucide-react';
import { TicketStatus } from '../types';

interface AdminStatusManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: TicketStatus;
  onStatusChange: (status: TicketStatus, reason: string) => void;
  isChanging: boolean;
}

const AdminStatusManager: React.FC<AdminStatusManagerProps> = ({
  isOpen,
  onClose,
  currentStatus,
  onStatusChange,
  isChanging,
}) => {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

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
    setSelectedAction(action);
    setReason('');
    setShowReasonInput(true);
  };

  const handleConfirmStatusChange = () => {
    if (!reason.trim()) {
      // Don't close modal, just show a subtle error hint
      return;
    }

    onStatusChange(selectedAction as TicketStatus, reason.trim());
    handleClose();
  };

  const handleClose = () => {
    setSelectedAction('');
    setReason('');
    setShowReasonInput(false);
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-lg transform rounded-2xl bg-white p-6 shadow-2xl transition-all animate-modal-in">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Admin Status Management</h3>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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

          {!showReasonInput ? (
            <>
              {/* Available Actions */}
              <div className="space-y-2 mb-4">
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
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Admin Override</p>
                    <p>This bypasses normal workflow rules. Use only when necessary to correct ticket status.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Reason Input */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Change Status to: <span className="capitalize text-purple-600">{selectedAction}</span>
                </h4>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for status change:
                </label>
                   <textarea
                     value={reason}
                     onChange={(e) => setReason(e.target.value)}
                     placeholder="Explain why you're changing the status..."
                     rows={4}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-500"
                     required
                   />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReasonInput(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  disabled={!reason.trim() || isChanging}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isChanging ? 'Changing...' : 'Change Status'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStatusManager;
