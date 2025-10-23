import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { managerService } from '../services/managerService';
import { useModal } from '../hooks/useModal';
import Modal from './Modal';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  ticketBrand: string;
  currentAssignee?: string | null;
  currentAssigneeName?: string | null;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  ticketBrand,
  currentAssignee,
  currentAssigneeName,
}) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();
  const { modalState, showSuccess, showError, hideModal } = useModal();

  // Fetch team members
  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => managerService.getTeamMembers(),
    enabled: isOpen,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      managerService.assignTicket(ticketNumber, {
        assigned_to: selectedUser,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketNumber] });
      queryClient.invalidateQueries({ queryKey: ['pending-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['team-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['incoming-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['outgoing-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['team-workload'] });
      
      const isReassignment = currentAssignee !== null && currentAssignee !== undefined;
      showSuccess(
        isReassignment ? 'Ticket Reassigned!' : 'Ticket Assigned!', 
        isReassignment 
          ? `Ticket reassigned successfully from ${currentAssigneeName} to new team member.`
          : 'Ticket assigned successfully to team member.'
      );
      hideModal();
      onClose();
      setSelectedUser('');
      setNotes('');
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || 'Failed to assign ticket');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      showError('Please select a team member');
      return;
    }

    assignMutation.mutate();
  };

  const activeTeamMembers = teamData?.team_members.filter(member => member.is_active) || [];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentAssignee ? 'Reassign Ticket' : 'Assign Ticket'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {ticketNumber} - {ticketBrand}
                </p>
                {currentAssignee && currentAssigneeName && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    Currently assigned to: {currentAssigneeName}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Team Member
                </label>
                {isLoading ? (
                  <div className="text-gray-500 text-sm">Loading team members...</div>
                ) : activeTeamMembers.length === 0 ? (
                  <div className="text-red-500 text-sm">No active team members available</div>
                ) : (
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select --</option>
                    {activeTeamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email} ({member.active_tickets} active tickets)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes or context for the assignee..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={assignMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={assignMutation.isPending || activeTeamMembers.length === 0}
                >
                  {assignMutation.isPending 
                    ? (currentAssignee ? 'Reassigning...' : 'Assigning...') 
                    : (currentAssignee ? 'Reassign' : 'Assign')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal {...modalState} onClose={hideModal} />
    </>
  );
};

