import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { managerService } from '../services/managerService';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

const ManagerOverview: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  // Fetch incoming tickets (tickets needing assignment to team)
  const { data: incomingData } = useQuery({
    queryKey: ['incoming-tickets'],
    queryFn: () => managerService.getIncomingTickets(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch outgoing tickets (tickets created by team)
  const { data: outgoingData } = useQuery({
    queryKey: ['outgoing-tickets'],
    queryFn: () => managerService.getOutgoingTickets(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch team workload summary
  const { data: workloadData, isLoading: workloadLoading } = useQuery({
    queryKey: ['team-workload'],
    queryFn: () => managerService.getTeamWorkload(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch team metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['team-metrics'],
    queryFn: () => managerService.getTeamMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const incomingTickets = incomingData?.tickets || [];
  const outgoingTickets = outgoingData?.tickets || [];
  const workload = workloadData?.workload || [];
  const metrics = metricsData;

  // Calculate incoming ticket counts by status
  const incomingCounts = {
    unassigned: incomingTickets.filter(t => !t.assigned_to).length,
    urgent: incomingTickets.filter(t => t.priority === 'urgent').length,
    high: incomingTickets.filter(t => t.priority === 'high').length,
    total: incomingTickets.length
  };

  // Calculate outgoing ticket counts by status
  const outgoingCounts = {
    open: outgoingTickets.filter(t => t.status === 'open').length,
    processed: outgoingTickets.filter(t => t.status === 'processed').length,
    resolved: outgoingTickets.filter(t => t.status === 'resolved').length,
    reopened: outgoingTickets.filter(t => t.status === 're-opened').length,
    total: outgoingTickets.length
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processed': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 're-opened': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-full space-y-8 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Manager Overview"
        badge="Manager"
      >
        <p className="text-gray-600 mt-1">
          Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span> 👋
        </p>
      </PageHeader>

      {/* Incoming vs Outgoing Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Tickets Card */}
        <div className="stat-card-blue">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                <ArrowDownCircle className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Incoming</h2>
                <p className="text-xs text-blue-600 font-medium">Tickets escalated TO your team</p>
              </div>
            </div>
            <Link
              to="/incoming"
              className="text-blue-700 hover:text-blue-900 text-sm font-semibold flex items-center bg-blue-100 px-3 py-1.5 rounded-lg"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Unassigned</span>
              <span className="text-2xl font-bold text-blue-600">{incomingCounts.unassigned}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Urgent Priority</span>
              <span className="text-lg font-semibold text-red-600">{incomingCounts.urgent}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">High Priority</span>
              <span className="text-lg font-semibold text-orange-600">{incomingCounts.high}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Total</span>
              <span className="text-lg font-bold text-gray-900">{incomingCounts.total}</span>
            </div>
          </div>
        </div>

        {/* Outgoing Tickets Card */}
        <div className="stat-card-purple">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                <ArrowUpCircle className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Outgoing</h2>
                <p className="text-xs text-purple-600 font-medium">Tickets created BY your team</p>
              </div>
            </div>
            <Link
              to="/outgoing"
              className="text-purple-700 hover:text-purple-900 text-sm font-semibold flex items-center bg-purple-100 px-3 py-1.5 rounded-lg"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Open</span>
              <span className="text-2xl font-bold text-blue-600">{outgoingCounts.open}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Processed</span>
              <span className="text-lg font-semibold text-yellow-600">{outgoingCounts.processed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Resolved</span>
              <span className="text-lg font-semibold text-green-600">{outgoingCounts.resolved}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Total</span>
              <span className="text-lg font-bold text-gray-900">{outgoingCounts.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Workload */}
      <div className="card-modern">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Team Workload</h2>
          </div>
          <Link
            to="/my-team"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
          >
            Manage Team →
          </Link>
        </div>

        {workloadLoading ? (
          <div className="text-gray-500">Loading team workload...</div>
        ) : workload.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No team members found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workload.map((member: any) => (
              <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    member.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Tickets</span>
                    <span className="font-semibold">{member.active_tickets || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Open</span>
                    <span className="text-blue-600">{member.open_tickets || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processed</span>
                    <span className="text-yellow-600">{member.processed_tickets || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Resolved</span>
                    <span className="text-green-600">{member.resolved_tickets || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Metrics */}
      <div className="card-modern">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Quick Metrics</h2>
          </div>
          <Link
            to="/team-performance"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
          >
            View Details →
          </Link>
        </div>

        {metricsLoading ? (
          <div className="text-gray-500">Loading metrics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.avg_resolution_time_hours ? `${metrics.avg_resolution_time_hours.toFixed(1)}h` : 'N/A'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.total_tickets && metrics.total_tickets > 0 
                  ? `${Math.round((metrics.resolved_tickets / metrics.total_tickets) * 100)}%` 
                  : 'N/A'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Reopen Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics?.reopen_rate ? `${metrics.reopen_rate.toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card-modern">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrendingUp className="w-6 h-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>
        </div>

        <div className="space-y-3">
          {/* Show recent incoming tickets */}
          {incomingTickets.slice(0, 3).map((ticket: any) => (
            <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <ArrowDownCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{ticket.ticket_number}</p>
                  <p className="text-sm text-gray-600">{ticket.brand_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                {!ticket.assigned_to && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Show recent outgoing tickets */}
          {outgoingTickets.slice(0, 2).map((ticket: any) => (
            <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <ArrowUpCircle className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">{ticket.ticket_number}</p>
                  <p className="text-sm text-gray-600">{ticket.brand_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
                {ticket.assigned_to_name && (
                  <span className="text-xs text-gray-500">
                    → {ticket.assigned_to_name}
                  </span>
                )}
              </div>
            </div>
          ))}

          {incomingTickets.length === 0 && outgoingTickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerOverview;
