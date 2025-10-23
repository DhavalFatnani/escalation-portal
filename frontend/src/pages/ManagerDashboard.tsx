import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { managerService } from '../services/managerService';
import { useAuthStore } from '../stores/authStore';
import { AssignmentModal } from '../components/AssignmentModal';
import { Ticket } from '../types';

const ManagerDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(user?.auto_assign_enabled || false);

  // Fetch pending tickets
  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-tickets'],
    queryFn: () => managerService.getPendingTickets(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch team metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['team-metrics'],
    queryFn: () => managerService.getTeamMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleAutoAssignToggle = async () => {
    try {
      const newValue = !autoAssignEnabled;
      await managerService.toggleAutoAssign(newValue);
      setAutoAssignEnabled(newValue);
    } catch (error) {
      console.error('Failed to toggle auto-assign:', error);
    }
  };

  const pendingTickets = pendingData?.tickets || [];
  const metrics = metricsData;
  const teamMembers = metrics?.team_members || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome, {user?.name}! Manage your team and assign tickets.
        </p>
      </div>

      {/* Pending Assignments Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Pending Assignments ({pendingTickets.length})
          </h2>
          <Link
            to="/team-management"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Manage Team →
          </Link>
        </div>

        {pendingLoading ? (
          <div className="text-gray-500">Loading pending tickets...</div>
        ) : pendingTickets.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-green-800 font-medium">All caught up!</p>
            <p className="text-green-600 text-sm mt-1">No pending assignments at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${getPriorityColor(
                  ticket.priority
                )}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Link
                    to={`/tickets/${ticket.ticket_number}`}
                    className="font-mono font-bold text-sm hover:underline"
                  >
                    {ticket.ticket_number}
                  </Link>
                  <span className="text-xs font-semibold uppercase px-2 py-1 rounded">
                    {ticket.priority}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{ticket.brand_name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {ticket.description || 'No description'}
                </p>
                <div className="text-xs text-gray-500 mb-3">
                  Created by: {ticket.creator_name || ticket.creator_email}
                </div>
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Assign →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Workload Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Team Workload</h2>
          <label className="flex items-center space-x-2 cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Auto-Assign</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={autoAssignEnabled}
                onChange={handleAutoAssignToggle}
                className="sr-only"
              />
              <div
                className={`block w-12 h-6 rounded-full transition ${
                  autoAssignEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              ></div>
              <div
                className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${
                  autoAssignEnabled ? 'translate-x-6' : ''
                }`}
              ></div>
            </div>
          </label>
        </div>

        {metricsLoading ? (
          <div className="text-gray-500">Loading team data...</div>
        ) : teamMembers.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600">No team members found.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const maxTickets = Math.max(...teamMembers.map((m) => m.active_tickets), 1);
                const widthPercent = (member.active_tickets / maxTickets) * 100;

                return (
                  <div key={member.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {member.name || member.email}
                        {!member.is_active && (
                          <span className="ml-2 text-xs text-red-600">(Inactive)</span>
                        )}
                      </span>
                      <span className="text-sm text-gray-600">
                        {member.active_tickets} tickets
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          member.active_tickets > maxTickets * 0.7
                            ? 'bg-red-500'
                            : member.active_tickets > maxTickets * 0.4
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Team Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Open Tickets</div>
          <div className="text-3xl font-bold text-blue-600">
            {metricsLoading ? '...' : metrics?.open_tickets || 0}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Processed Tickets</div>
          <div className="text-3xl font-bold text-yellow-600">
            {metricsLoading ? '...' : metrics?.processed_tickets || 0}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Avg Resolution Time</div>
          <div className="text-3xl font-bold text-green-600">
            {metricsLoading
              ? '...'
              : metrics?.avg_resolution_time_hours
              ? `${metrics.avg_resolution_time_hours.toFixed(1)}h`
              : 'N/A'}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Reopen Rate</div>
          <div className="text-3xl font-bold text-purple-600">
            {metricsLoading
              ? '...'
              : metrics?.reopen_rate
              ? `${metrics.reopen_rate.toFixed(1)}%`
              : '0%'}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedTicket && (
        <AssignmentModal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          ticketNumber={selectedTicket.ticket_number}
          ticketBrand={selectedTicket.brand_name}
        />
      )}
    </div>
  );
};

export default ManagerDashboard;

