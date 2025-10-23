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
  ArrowRight
} from 'lucide-react';
import { ticketService } from '../services/ticketService';
import { useAuthStore } from '../stores/authStore';
import { Ticket } from '../types';
import PageHeader from '../components/PageHeader';

const AssignedToMe: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Fetch tickets assigned to the user
  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: ['my-assigned-tickets', { search: searchTerm, status: statusFilter, priority: priorityFilter }],
    queryFn: () => ticketService.getTickets({
      assigned_to: user?.id,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? [statusFilter as any] : undefined,
      priority: priorityFilter !== 'all' ? [priorityFilter as any] : undefined,
      limit: 100
    }),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const assignedTickets = assignedData?.tickets || [];

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
        title="Assigned to Me"
        subtitle="Tickets assigned to you by your manager"
        icon={<Briefcase className="w-8 h-8 text-green-600" />}
      />

      {/* Filters and Search */}
      <div className="card-modern">
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

      {/* Tickets List */}
      <div className="card-modern">
        {assignedLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p>Loading assigned tickets...</p>
          </div>
        ) : assignedTickets.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-medium mb-2">No tickets assigned to you</p>
            <p className="text-sm text-gray-400">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Your manager will assign tickets to you as they come in'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                {assignedTickets.length} ticket{assignedTickets.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Tickets */}
            {assignedTickets.map((ticket: Ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.ticket_number}`}
                className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-green-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-mono font-bold text-gray-900 group-hover:text-green-600 transition-colors">
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
                      <span>Created by: {ticket.creator_name}</span>
                      <span>•</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{getDaysSinceCreated(ticket.created_at)} days ago</span>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex items-center ml-4">
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
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

export default AssignedToMe;

