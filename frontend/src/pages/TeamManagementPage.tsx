import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerService } from '../services/managerService';
import { useModal } from '../hooks/useModal';
import Modal from '../components/Modal';

const TeamManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { modalState, showSuccess, showError, showConfirm, hideModal } = useModal();

  // Fetch team members
  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => managerService.getTeamMembers(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (userId: string) => managerService.toggleUserActive(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-metrics'] });
      showSuccess(data.message);
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || 'Failed to update user status');
    },
  });

  const handleToggleActive = (userId: string, name: string, isActive: boolean) => {
    const action = isActive ? 'deactivate' : 'activate';
    showConfirm(
      `Are you sure you want to ${action} ${name}?`,
      () => {
        hideModal();
        toggleActiveMutation.mutate(userId);
      },
      hideModal
    );
  };

  const teamMembers = teamData?.team_members || [];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600 mt-1">Manage your team members and their access.</p>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Loading team members...</div>
      ) : teamMembers.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No team members found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className={`bg-white border-2 rounded-lg p-6 ${
                member.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50'
              }`}
            >
              {/* Profile Section */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {(member.name || member.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{member.name || 'No Name'}</h3>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    member.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium text-gray-900 capitalize">{member.role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Tickets:</span>
                  <span className="font-medium text-gray-900">{member.active_tickets}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Login:</span>
                  <span className="font-medium text-gray-900">
                    {member.last_login_at
                      ? new Date(member.last_login_at).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => handleToggleActive(member.id, member.name || member.email, member.is_active)}
                disabled={toggleActiveMutation.isPending}
                className={`w-full px-4 py-2 rounded-md font-medium text-sm transition ${
                  member.is_active
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {toggleActiveMutation.isPending
                  ? 'Processing...'
                  : member.is_active
                  ? 'Deactivate'
                  : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal {...modalState} onClose={hideModal} />
    </div>
  );
};

export default TeamManagementPage;

