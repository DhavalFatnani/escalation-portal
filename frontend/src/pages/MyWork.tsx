import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  User,
  ArrowRight,
  Send
} from 'lucide-react';
import { ticketService } from '../services/ticketService';
import { useAuthStore } from '../stores/authStore';
import { Ticket } from '../types';
import PageHeader from '../components/PageHeader';

const MyWork: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [includeResolved, setIncludeResolved] = useState(false);

  // Build status filter: exclude resolved/closed by default unless includeResolved is true
  const getEffectiveStatusFilter = (filter: string) => {
    if (filter !== 'all') {
      return [filter as any];
    }
    if (!includeResolved) {
      return ['open', 'processed', 're-opened'] as any[];
    }
    return undefined;
  };

  // Fetch tickets assigned to the user
  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: ['my-assigned-tickets', { search: searchTerm, status: statusFilter, priority: priorityFilter, includeResolved }],
    queryFn: () => ticketService.getTickets({
      assigned_to: user?.id,
      search: searchTerm || undefined,
      status: getEffectiveStatusFilter(statusFilter),
      priority: priorityFilter !== 'all' ? [priorityFilter as any] : undefined,
      limit: 50
    }),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch tickets created by the user
  const { data: createdData, isLoading: createdLoading } = useQuery({
    queryKey: ['my-created-tickets', { search: searchTerm, status: statusFilter, priority: priorityFilter, includeResolved }],
    queryFn: () => ticketService.getTickets({
      created_by: user?.id,
      search: searchTerm || undefined,
      status: getEffectiveStatusFilter(statusFilter),
      priority: priorityFilter !== 'all' ? [priorityFilter as any] : undefined,
      limit: 50
    }),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const assignedTickets = assignedData?.tickets || [];
  const createdTickets = createdData?.tickets || [];

  // Calculate counts for each section
  const assignedCounts = {
    total: assignedTickets.length,
    open: assignedTickets.filter(t => t.status === 'open').length,
    processed: assignedTickets.filter(t => t.status === 'processed').length,
    resolved: assignedTickets.filter(t => t.status === 'resolved').length,
    urgent: assignedTickets.filter(t => t.priority === 'urgent').length,
  };

  const createdCounts = {
    total: createdTickets.length,
    open: createdTickets.filter(t => t.status === 'open').length,
    processed: createdTickets.filter(t => t.status === 'processed').length,
    resolved: createdTickets.filter(t => t.status === 'resolved').length,
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

  return (
    <div className="max-w-full space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="My Work"
        icon={<Briefcase className="w-8 h-8 text-green-600" />}
        badge="Team Member"
      >
        <p className="text-gray-600 mt-1">
          Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span> 👋
        </p>
      </PageHeader>

      {/* Work Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assigned to Me */}
        <div className="stat-card-green">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                <User className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Assigned to Me</h2>
                <p className="text-xs text-green-600 font-medium">{assignedCounts.total} tickets</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Open</span>
              <span className="text-lg font-semibold text-blue-600">{assignedCounts.open}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Processed</span>
              <span className="text-lg font-semibold text-yellow-600">{assignedCounts.processed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Resolved</span>
              <span className="text-lg font-semibold text-green-600">{assignedCounts.resolved}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Urgent Priority</span>
              <span className="text-lg font-bold text-red-600">{assignedCounts.urgent}</span>
            </div>
          </div>
        </div>

        {/* I Created */}
        <div className="stat-card-purple">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                <Send className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">I Created</h2>
                <p className="text-xs text-purple-600 font-medium">{createdCounts.total} tickets</p>
              </div>
            </div>
            <Link
              to="/my-escalations"
              className="text-purple-700 hover:text-purple-900 text-sm font-semibold flex items-center bg-purple-100 px-3 py-1.5 rounded-lg"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Open</span>
              <span className="text-lg font-semibold text-blue-600">{createdCounts.open}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Processed</span>
              <span className="text-lg font-semibold text-yellow-600">{createdCounts.processed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Resolved</span>
              <span className="text-lg font-semibold text-green-600">{createdCounts.resolved}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Total</span>
              <span className="text-lg font-bold text-gray-900">{createdCounts.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card-modern">
        {/* Include Resolved/Closed Toggle - Compact version */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Show Resolved & Closed</p>
                <p className="text-xs text-gray-600">
                  {includeResolved 
                    ? 'Including resolved and closed tickets' 
                    : 'Only active tickets (open, processed, re-opened)'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setIncludeResolved(!includeResolved)}
              style={{
                position: 'relative',
                display: 'inline-flex',
                height: '28px',
                width: '52px',
                alignItems: 'center',
                borderRadius: '9999px',
                transition: 'background-color 0.2s',
                backgroundColor: includeResolved ? '#059669' : '#d1d5db',
                outline: 'none',
                border: '2px solid',
                borderColor: includeResolved ? '#059669' : '#d1d5db',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              aria-label={includeResolved ? 'Hide resolved tickets' : 'Show resolved tickets'}
            >
              <span
                style={{
                  display: 'inline-block',
                  height: '20px',
                  width: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'transform 0.2s',
                  transform: includeResolved ? 'translateX(24px)' : 'translateX(4px)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="processed">Processed</option>
              <option value="resolved">Resolved</option>
              <option value="re-opened">Reopened</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

      {/* Assigned Tickets */}
      <div className="card-modern">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <User className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Assigned to Me</h2>
          </div>
          <span className="text-sm text-gray-500">
            {assignedTickets.length} ticket{assignedTickets.length !== 1 ? 's' : ''}
          </span>
        </div>

        {assignedLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p>Loading assigned tickets...</p>
          </div>
        ) : assignedTickets.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-medium mb-2">No tickets assigned to you</p>
            <p className="text-sm text-gray-400">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Your manager will assign tickets to you as they come in'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedTickets.map((ticket: Ticket) => (
              <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Link
                        to={`/tickets/${ticket.ticket_number}`}
                        className="font-mono font-bold text-gray-900 hover:text-blue-600"
                      >
                        {ticket.ticket_number}
                      </Link>
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
                      <span>Created by: {ticket.creator_name}</span>
                      <span>•</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{getDaysSinceCreated(ticket.created_at)} days ago</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center ml-4">
                    <Link
                      to={`/tickets/${ticket.ticket_number}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center"
                    >
                      View Details
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Created Tickets */}
      <div className="card-modern">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Send className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Escalations</h2>
          </div>
          <Link
            to="/my-escalations"
            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center"
          >
            View All →
          </Link>
        </div>

        {createdLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p>Loading your escalations...</p>
          </div>
        ) : createdTickets.slice(0, 5).length === 0 ? (
          <div className="text-center py-16">
            <Send className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-medium mb-2">No escalations yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Create your first ticket to get started via sidebar
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {createdTickets.slice(0, 5).map((ticket: Ticket) => (
              <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Link
                        to={`/tickets/${ticket.ticket_number}`}
                        className="font-mono font-bold text-gray-900 hover:text-purple-600"
                      >
                        {ticket.ticket_number}
                      </Link>
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
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center ml-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {ticket.status === 'resolved' ? 'Completed' : 'In Progress'}
                      </p>
                      {ticket.resolved_at && (
                        <p className="text-xs text-gray-500">
                          Resolved: {new Date(ticket.resolved_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWork;
