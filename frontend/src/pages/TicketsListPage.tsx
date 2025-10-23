import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { managerService } from '../services/managerService';
import { Search, Filter, Ticket as TicketIcon, ArrowRight, X, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { TicketStatus, TicketPriority } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useModal } from '../hooks/useModal';
import Modal from '../components/Modal';

export default function TicketsListPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { modalState, showSuccess, showError, hideModal } = useModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [includeResolved, setIncludeResolved] = useState(searchParams.get('includeResolved') === 'true');
  const [teamFilter, setTeamFilter] = useState<'all' | 'created' | 'assigned'>('all');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15; // Reduced from default for free tier
  
  const statusFilter = searchParams.get('status') as TicketStatus | undefined;
  const priorityFilter = searchParams.get('priority') as TicketPriority | undefined;

  // Build status filter: exclude resolved/closed by default unless includeResolved is true
  const effectiveStatusFilter = (() => {
    if (statusFilter) {
      // User has manually selected a specific status
      return [statusFilter];
    }
    if (!includeResolved) {
      // Default: exclude resolved and closed
      return ['open', 'processed', 're-opened'] as TicketStatus[];
    }
    // Include all statuses
    return undefined;
  })();

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', effectiveStatusFilter, priorityFilter, search, page, ITEMS_PER_PAGE],
    queryFn: () => ticketService.getTickets({
      status: effectiveStatusFilter,
      priority: priorityFilter ? [priorityFilter] : undefined,
      search,
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
    }),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch team members for managers
  const { data: teamData } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => managerService.getTeamMembers(),
    enabled: user?.is_manager || user?.role === 'admin',
    refetchInterval: 30000,
  });

  // Assignment mutation for managers
  const assignMutation = useMutation({
    mutationFn: ({ ticketNumber, assigneeId }: { ticketNumber: string; assigneeId: string }) =>
      managerService.assignTicket(ticketNumber, { assigned_to: assigneeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showSuccess('Ticket assigned successfully');
    },
    onError: () => {
      showError('Failed to assign ticket');
    },
  });

  const handleIndividualAssign = (ticketNumber: string, assigneeId: string) => {
    assignMutation.mutate({ ticketNumber, assigneeId });
  };

  // Filter tickets based on team filter - Updated for manager workflow
  const filteredTickets = data?.tickets?.filter(ticket => {
    if (teamFilter === 'all') return true;
    
    // For managers, show tickets based on assignment
    if (user?.is_manager || user?.role === 'admin') {
      if (teamFilter === 'created') {
        // Show tickets created by my team members
        return ticket.creator_role === user?.role;
      }
      if (teamFilter === 'assigned') {
        // Show tickets assigned to my team members
        return ticket.assigned_to_name && ticket.creator_role !== user?.role;
      }
    } else {
      // For team members, show their assigned tickets
      if (teamFilter === 'created') {
        // Show tickets they created
        return ticket.created_by === user?.id;
      }
      if (teamFilter === 'assigned') {
        // Show tickets assigned to them
        return ticket.assigned_to === user?.id;
      }
    }
    return true;
  }) || [];

  const teamMembers = teamData?.team_members || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const toggleFilter = (type: 'status' | 'priority', value: string) => {
    setPage(1); // Reset to first page on filter change
    const params = new URLSearchParams(searchParams);
    
    // Single selection: if clicking the same value, deselect it
    const current = params.get(type);
    if (current === value) {
      params.delete(type);
    } else {
      params.set(type, value);
    }
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearch('');
    setIncludeResolved(false);
  };

  const hasFilters = statusFilter || priorityFilter || search;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'high': return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
      case 'medium': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white';
      case 'low': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processed': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 're-opened': return 'bg-red-100 text-red-700 border-red-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center">
            <TicketIcon className="w-5 h-5 mr-2 text-indigo-600" />
            <span className="text-gradient">All Tickets</span>
          </h1>
          <p className="text-sm text-gray-600">View and manage escalation tickets</p>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card-modern">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticket number, brand, or description..."
                className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 placeholder-gray-500 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Search
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Include Resolved/Closed Toggle */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TicketIcon className="w-3 h-3 text-blue-600" />
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
                onClick={() => {
                  const newValue = !includeResolved;
                  setIncludeResolved(newValue);
                  setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    if (newValue) {
                      newParams.set('includeResolved', 'true');
                    } else {
                      newParams.delete('includeResolved');
                    }
                    return newParams;
                  });
                }}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  height: '28px',
                  width: '52px',
                  alignItems: 'center',
                  borderRadius: '9999px',
                  transition: 'background-color 0.2s',
                  backgroundColor: includeResolved ? '#2563eb' : '#d1d5db',
                  outline: 'none',
                  border: '2px solid',
                  borderColor: includeResolved ? '#2563eb' : '#d1d5db',
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

          {/* Status Filter */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center uppercase tracking-wide">
              <Filter className="w-4 h-4 mr-2 text-indigo-600" />
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {(['open', 'processed', 're-opened', 'resolved', 'closed'] as TicketStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => toggleFilter('status', status)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                    statusFilter === status
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center uppercase tracking-wide">
              <Filter className="w-4 h-4 mr-2 text-indigo-600" />
              Priority
            </p>
            <div className="flex flex-wrap gap-2">
              {(['urgent', 'high', 'medium', 'low'] as TicketPriority[]).map((priority) => (
                <button
                  key={priority}
                  onClick={() => toggleFilter('priority', priority)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 capitalize ${
                    priorityFilter === priority
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Filter - Only show for Growth/Ops users */}
        {(user?.role === 'growth' || user?.role === 'ops') && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center uppercase tracking-wide">
              <Filter className="w-4 h-4 mr-2 text-indigo-600" />
              Team View
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTeamFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  teamFilter === 'all'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Tickets
              </button>
              <button
                onClick={() => setTeamFilter('created')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  teamFilter === 'created'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {(user?.is_manager || (user?.role as string) === 'admin') ? 'My Team Created' : 'I Created'}
              </button>
              <button
                onClick={() => setTeamFilter('assigned')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  teamFilter === 'assigned'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {(user?.is_manager || (user?.role as string) === 'admin') ? 'Assigned to My Team' : 'Assigned to Me'}
              </button>
            </div>
          </div>
        )}

        {/* Include Resolved Checkbox */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={includeResolved}
              onChange={(e) => {
                const newValue = e.target.checked;
                setIncludeResolved(newValue);
                const params = new URLSearchParams(searchParams);
                if (newValue) {
                  params.set('includeResolved', 'true');
                } else {
                  params.delete('includeResolved');
                }
                setSearchParams(params);
              }}
              className="w-5 h-5 text-indigo-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              Include Resolved & Closed Tickets
            </span>
          </label>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card-modern">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <Sparkles className="w-6 h-6 text-indigo-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredTickets.length} {filteredTickets.length === 1 ? 'Ticket' : 'Tickets'}
              {teamFilter !== 'all' && data?.total && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (of {data.total} total)
                </span>
              )}
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4 animate-pulse">
              <TicketIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-gray-500 font-medium">Loading tickets...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket, index) => (
              <div key={ticket.id} className="relative">
                <Link
                  to={`/tickets/${ticket.ticket_number}`}
                  className="block p-5 bg-gray-50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-200 group animate-slide-in-right"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        <span className="text-sm font-bold text-gray-900 font-mono bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
                          {ticket.ticket_number}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${getPriorityColor(ticket.priority)} shadow-sm`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-base font-semibold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
                        {ticket.brand_name}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {ticket.description || 'No description'}
                      </p>
                      <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center bg-white px-3 py-1 rounded-full">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                          {ticket.creator_name || ticket.creator_email}
                        </span>
                        {ticket.assigned_to_name ? (
                          <span className="flex items-center bg-green-50 px-3 py-1 rounded-full text-green-700 font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Assigned to {ticket.assigned_to_name}
                          </span>
                        ) : (user?.is_manager || user?.role === 'admin') ? (
                          <span className="flex items-center bg-orange-50 px-3 py-1 rounded-full text-orange-700 font-medium">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                            Unassigned
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end">
                      <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full mb-2">
                        {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>

                {/* Assignment Actions for Managers - Outside of Link to prevent navigation */}
                {(user?.is_manager || user?.role === 'admin') && ticket.status !== 'resolved' && (
                  <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                    {ticket.assigned_to ? (
                      <div className="flex flex-col items-end space-y-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Assigned to</p>
                          <p className="text-sm font-medium text-green-600">{ticket.assigned_to_name}</p>
                        </div>
                        <select
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.value) handleIndividualAssign(ticket.ticket_number, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1 text-xs border border-orange-300 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium"
                          defaultValue=""
                        >
                          <option value="">Reassign to...</option>
                          {teamMembers.filter(member => member.is_active).map(member => (
                            <option key={member.id} value={member.id}>
                              {member.name} ({member.active_tickets || 0})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                        <select
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.value) handleIndividualAssign(ticket.ticket_number, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          defaultValue=""
                        >
                          <option value="">Assign to...</option>
                          {teamMembers.filter(member => member.is_active).map(member => (
                            <option key={member.id} value={member.id}>
                              {member.name} ({member.active_tickets || 0})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filteredTickets.length === 0 && (
              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <TicketIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-2">No tickets found</p>
                <p className="text-sm text-gray-400">
                  {teamFilter !== 'all' 
                    ? (user?.is_manager || user?.role === 'admin')
                      ? 'No tickets match your team filter. Try selecting "All Tickets" to see all tickets assigned to your team.'
                      : 'No tickets match your team filter. Try selecting "All Tickets"'
                    : (user?.is_manager || user?.role === 'admin')
                      ? 'No tickets are currently assigned to your team members.'
                      : 'No tickets are currently assigned to you.'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && data && data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{((page - 1) * ITEMS_PER_PAGE) + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(page * ITEMS_PER_PAGE, data.total)}</span> of{' '}
              <span className="font-semibold">{data.total}</span> tickets
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                  // Show first page, current page, and last page with ellipsis
                  let pageNum;
                  if (data.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= data.totalPages - 2) {
                    pageNum = data.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        type={modalState.type}
      >
        {modalState.message}
      </Modal>
    </div>
  );
}