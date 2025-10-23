import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  ArrowUpCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Filter,
  Search,
  TrendingUp,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { managerService } from '../services/managerService';
import { useAuthStore } from '../stores/authStore';
import { Ticket } from '../types';
import PageHeader from '../components/PageHeader';

const OutgoingTickets: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [teamMemberFilter, setTeamMemberFilter] = useState<string>('all');

  // Fetch outgoing tickets
  const { data: outgoingData, isLoading: outgoingLoading } = useQuery({
    queryKey: ['outgoing-tickets'],
    queryFn: () => managerService.getOutgoingTickets(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch team members for filtering
  const { data: teamData } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => managerService.getTeamMembers(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const outgoingTickets = outgoingData?.tickets || [];
  const teamMembers = teamData?.team_members || [];

  // Filter tickets based on search and filters
  const filteredTickets = outgoingTickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesTeamMember = teamMemberFilter === 'all' || ticket.created_by === teamMemberFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesTeamMember;
  });

  // Calculate counts by status
  const statusCounts = {
    open: outgoingTickets.filter(t => t.status === 'open').length,
    processed: outgoingTickets.filter(t => t.status === 'processed').length,
    resolved: outgoingTickets.filter(t => t.status === 'resolved').length,
    reopened: outgoingTickets.filter(t => t.status === 're-opened').length,
    total: outgoingTickets.length
  };

  // Calculate counts by priority
  const priorityCounts = {
    urgent: outgoingTickets.filter(t => t.priority === 'urgent').length,
    high: outgoingTickets.filter(t => t.priority === 'high').length,
    medium: outgoingTickets.filter(t => t.priority === 'medium').length,
    low: outgoingTickets.filter(t => t.priority === 'low').length,
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
        title="Outgoing Tickets"
        subtitle="Tickets created BY your team members - track their progress"
        icon={<ArrowUpCircle className="w-8 h-8 text-purple-600" />}
      />

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Open</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.open}</p>
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
              <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.processed}</p>
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
              <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.resolved}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card-red">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Reopened</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.reopened}</p>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="card-modern">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Priority Breakdown</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Urgent</p>
            <p className="text-xl font-bold text-red-600">{priorityCounts.urgent}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">High</p>
            <p className="text-xl font-bold text-orange-600">{priorityCounts.high}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Medium</p>
            <p className="text-xl font-bold text-yellow-600">{priorityCounts.medium}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Low</p>
            <p className="text-xl font-bold text-green-600">{priorityCounts.low}</p>
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
                placeholder="Search tickets..."
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

          {/* Team Member Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={teamMemberFilter}
              onChange={(e) => setTeamMemberFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Team Members</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card-modern">
        {outgoingLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p>Loading outgoing tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <ArrowUpCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-medium mb-2">No outgoing tickets found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || teamMemberFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No tickets have been created by your team yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                {filteredTickets.length} ticket{filteredTickets.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Tracked by your team</span>
              </div>
            </div>

            {/* Tickets */}
            {filteredTickets.map((ticket: Ticket) => (
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
                      <span>Created by: {ticket.creator_name}</span>
                      <span>•</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
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

                  {/* Status and Progress */}
                  <div className="flex flex-col items-end space-y-2 ml-4">
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
                    
                    {/* Progress indicator */}
                    <div className="flex items-center space-x-1">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            ticket.status === 'resolved' ? 'bg-green-500' :
                            ticket.status === 'processed' ? 'bg-yellow-500' :
                            ticket.status === 're-opened' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}
                          style={{
                            width: ticket.status === 'resolved' ? '100%' :
                                   ticket.status === 'processed' ? '75%' :
                                   ticket.status === 're-opened' ? '50%' :
                                   '25%'
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {ticket.status === 'resolved' ? '100%' :
                         ticket.status === 'processed' ? '75%' :
                         ticket.status === 're-opened' ? '50%' :
                         '25%'}
                      </span>
                    </div>
                    
                    {/* Arrow indicator */}
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all mt-2" />
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

export default OutgoingTickets;
