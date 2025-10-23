import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { ticketService } from '../services/ticketService';
import { useAuthStore } from '../stores/authStore';
import { Ticket } from '../types';
import PageHeader from '../components/PageHeader';

const MyEscalations: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Fetch tickets created by the user
  const { data: createdData, isLoading: createdLoading } = useQuery({
    queryKey: ['my-created-tickets', { search: searchTerm, status: statusFilter, priority: priorityFilter }],
    queryFn: () => {
      console.log('MyEscalations Query - User ID:', user?.id, 'Role:', user?.role, 'Is Manager:', user?.is_manager);
      return ticketService.getTickets({
        created_by: user?.id,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? [statusFilter as any] : undefined,
        priority: priorityFilter !== 'all' ? [priorityFilter as any] : undefined,
        limit: 100
      });
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const createdTickets = createdData?.tickets || [];
  
  // Debug log to see what tickets are returned
  console.log('MyEscalations Tickets Returned:', createdTickets.map(t => ({
    ticket_number: t.ticket_number,
    created_by: t.creator_name,
    creator_role: t.creator_role,
    status: t.status,
    assigned_to: t.assigned_to_name
  })));

  // Calculate counts
  const counts = {
    total: createdTickets.length,
    open: createdTickets.filter(t => t.status === 'open').length,
    processed: createdTickets.filter(t => t.status === 'processed').length,
    resolved: createdTickets.filter(t => t.status === 'resolved').length,
    reopened: createdTickets.filter(t => t.status === 're-opened').length,
    urgent: createdTickets.filter(t => t.priority === 'urgent').length,
    high: createdTickets.filter(t => t.priority === 'high').length,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'processed': return <AlertCircle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 're-opened': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getDaysSinceCreated = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'resolved': return 100;
      case 'processed': return 75;
      case 're-opened': return 50;
      case 'open': return 25;
      default: return 0;
    }
  };

  return (
    <div className="max-w-full space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="My Escalations"
        subtitle="Track the progress of tickets you've created"
        icon={<Send className="w-8 h-8 text-purple-600" />}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.total}</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <Send className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Open</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.open}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card-yellow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Processed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.processed}</p>
            </div>
            <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Resolved</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.resolved}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="card-modern">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Priority Breakdown</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Urgent</p>
            <p className="text-xl font-bold text-red-600">{counts.urgent}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">High</p>
            <p className="text-xl font-bold text-orange-600">{counts.high}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Medium</p>
            <p className="text-xl font-bold text-yellow-600">
              {createdTickets.filter(t => t.priority === 'medium').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Low</p>
            <p className="text-xl font-bold text-green-600">
              {createdTickets.filter(t => t.priority === 'low').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card-modern">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search your escalations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="processed">Processed</option>
              <option value="resolved">Resolved</option>
              <option value="re-opened">Reopened</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card-modern">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Send className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Your Escalations</h2>
          </div>
          <span className="text-sm text-gray-500">
            {createdTickets.length} ticket{createdTickets.length !== 1 ? 's' : ''}
          </span>
        </div>

        {createdLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p>Loading your escalations...</p>
          </div>
        ) : createdTickets.length === 0 ? (
          <div className="text-center py-16">
            <Send className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-medium mb-2">No escalations found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first ticket via the sidebar'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                {createdTickets.length} escalation{createdTickets.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Tracked by you</span>
              </div>
            </div>

            {/* Tickets */}
            {createdTickets.map((ticket: Ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.ticket_number}`}
                className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-purple-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-mono font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {ticket.ticket_number}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">{ticket.status}</span>
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-1">{ticket.brand_name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {ticket.description || 'No description provided'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{getDaysSinceCreated(ticket.created_at)} days ago</span>
                      {ticket.assigned_to_name && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">Handled by: {ticket.assigned_to_name}</span>
                        </>
                      )}
                      {ticket.resolved_at && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">Resolved: {new Date(ticket.resolved_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress and Actions */}
                  <div className="flex flex-col items-end space-y-3 ml-4">
                    {/* Progress indicator */}
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            ticket.status === 'resolved' ? 'bg-green-500' :
                            ticket.status === 'processed' ? 'bg-yellow-500' :
                            ticket.status === 're-opened' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}
                          style={{
                            width: `${getProgressPercentage(ticket.status)}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {getProgressPercentage(ticket.status)}%
                      </span>
                    </div>
                    
                    {/* Arrow indicator */}
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEscalations;
