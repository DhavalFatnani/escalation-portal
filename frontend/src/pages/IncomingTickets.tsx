import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  ArrowDownCircle, 
  UserPlus, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Settings,
  Filter,
  Search,
  ArrowRight
} from 'lucide-react';
import { managerService } from '../services/managerService';
import { useAuthStore } from '../stores/authStore';
import { useModal } from '../hooks/useModal';
import Modal from '../components/Modal';
import CustomCheckbox from '../components/CustomCheckbox';
import { Ticket } from '../types';

const IncomingTickets: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { modalState, showSuccess, showError, hideModal } = useModal();
  
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(user?.auto_assign_enabled || false);

  // Fetch incoming tickets
  const { data: incomingData, isLoading: incomingLoading } = useQuery({
    queryKey: ['incoming-tickets'],
    queryFn: () => managerService.getIncomingTickets(),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch team members for assignment
  const { data: teamData } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => managerService.getTeamMembers(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Auto-assign toggle mutation
  const autoAssignMutation = useMutation({
    mutationFn: (enabled: boolean) => managerService.toggleAutoAssign(enabled),
    onSuccess: (_, enabled) => {
      setAutoAssignEnabled(enabled);
      // Update user state silently
      if (user) {
        setUser({ ...user, auto_assign_enabled: enabled });
      }
      queryClient.invalidateQueries({ queryKey: ['team-metrics'] });
    },
    onError: () => {
      setAutoAssignEnabled(!autoAssignEnabled);
      showError('Failed to update auto-assign setting');
    },
  });

  // Individual assignment mutation
  const assignMutation = useMutation({
    mutationFn: ({ ticketNumber, assigneeId }: { ticketNumber: string; assigneeId: string }) =>
      managerService.assignTicket(ticketNumber, { assigned_to: assigneeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['team-metrics'] });
      showSuccess('Ticket assigned successfully');
    },
    onError: () => {
      showError('Failed to assign ticket');
    },
  });

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: ({ ticketNumbers, assigneeId }: { ticketNumbers: string[]; assigneeId: string }) =>
      Promise.all(ticketNumbers.map(ticketNumber => 
        managerService.assignTicket(ticketNumber, { assigned_to: assigneeId })
      )),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['team-metrics'] });
      setSelectedTickets([]);
      setBulkAssignee('');
      showSuccess(`${selectedTickets.length} tickets assigned successfully`);
    },
    onError: () => {
      showError('Failed to assign tickets');
    },
  });

  const incomingTickets = incomingData?.tickets || [];
  const teamMembers = teamData?.team_members || [];

  // Filter tickets based on search and filters
  const filteredTickets = incomingTickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'unassigned' && !ticket.assigned_to) ||
      (statusFilter === 'assigned' && ticket.assigned_to);

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Calculate counts
  const counts = {
    total: incomingTickets.length,
    unassigned: incomingTickets.filter(t => !t.assigned_to).length,
    urgent: incomingTickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length,
    high: incomingTickets.filter(t => t.priority === 'high').length,
  };

  const handleAutoAssignToggle = () => {
    const newValue = !autoAssignEnabled;
    setAutoAssignEnabled(newValue);
    autoAssignMutation.mutate(newValue);
  };

  const handleIndividualAssign = (ticketNumber: string, assigneeId: string) => {
    assignMutation.mutate({ ticketNumber, assigneeId });
  };

  const handleBulkAssign = () => {
    if (selectedTickets.length === 0 || !bulkAssignee) return;
    bulkAssignMutation.mutate({ ticketNumbers: selectedTickets, assigneeId: bulkAssignee });
  };

  const handleSelectTicket = (ticketNumber: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketNumber) 
        ? prev.filter(t => t !== ticketNumber)
        : [...prev, ticketNumber]
    );
  };

  const handleSelectAll = () => {
    const unassignedTickets = filteredTickets.filter(t => !t.assigned_to);
    const unassignedTicketNumbers = unassignedTickets.map(t => t.ticket_number);
    
    // Check if all unassigned tickets are currently selected
    const allUnassignedSelected = unassignedTicketNumbers.every(ticketNumber => 
      selectedTickets.includes(ticketNumber)
    );
    
    if (allUnassignedSelected) {
      // Deselect all unassigned tickets
      setSelectedTickets(prev => prev.filter(ticketNumber => 
        !unassignedTicketNumbers.includes(ticketNumber)
      ));
    } else {
      // Select all unassigned tickets
      setSelectedTickets(prev => [
        ...prev.filter(ticketNumber => !unassignedTicketNumbers.includes(ticketNumber)),
        ...unassignedTicketNumbers
      ]);
    }
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1 flex items-center">
            <ArrowDownCircle className="w-8 h-8 mr-3 text-blue-600" />
            Incoming Tickets
          </h1>
          <p className="text-gray-600 mt-1">
            Tickets escalated TO your team that need assignment
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAutoAssignToggle}
            disabled={autoAssignMutation.isPending}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              autoAssignEnabled
                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
            } disabled:opacity-50`}
          >
            <Settings className="w-4 h-4 mr-2 inline" />
            Auto-Assign: {autoAssignEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.total}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <ArrowDownCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Unassigned</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.unassigned}</p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card-red">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Urgent</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.urgent}</p>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card-orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">High Priority</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{counts.high}</p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <div className="card-modern bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-blue-800">
                {selectedTickets.length} ticket{selectedTickets.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={bulkAssignee}
                onChange={(e) => setBulkAssignee(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select team member</option>
                {teamMembers.filter(member => member.is_active).map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.active_tickets || 0} active)
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkAssignee}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="card-modern">
        {incomingLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p>Loading incoming tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <ArrowDownCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-medium mb-2">No incoming tickets found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || priorityFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No tickets have been escalated to your team yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header with Select All */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CustomCheckbox
                  checked={(() => {
                    const unassignedTickets = filteredTickets.filter(t => !t.assigned_to);
                    const unassignedTicketNumbers = unassignedTickets.map(t => t.ticket_number);
                    return unassignedTicketNumbers.length > 0 && unassignedTicketNumbers.every(ticketNumber => 
                      selectedTickets.includes(ticketNumber)
                    );
                  })()}
                  indeterminate={(() => {
                    const unassignedTickets = filteredTickets.filter(t => !t.assigned_to);
                    const unassignedTicketNumbers = unassignedTickets.map(t => t.ticket_number);
                    const selectedUnassigned = selectedTickets.filter(ticketNumber => 
                      unassignedTicketNumbers.includes(ticketNumber)
                    );
                    return selectedUnassigned.length > 0 && selectedUnassigned.length < unassignedTicketNumbers.length;
                  })()}
                  onChange={handleSelectAll}
                  aria-label="Select all unassigned tickets"
                />
                <span className="text-sm font-medium text-gray-700">Select All Unassigned</span>
              </div>
              <span className="text-sm text-gray-500">
                {filteredTickets.length} ticket{filteredTickets.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Tickets */}
            {filteredTickets.map((ticket: Ticket) => (
              <div key={ticket.id} className="border border-gray-200 rounded-lg hover:border-blue-300 transition-all group relative">
                <Link
                  to={`/tickets/${ticket.ticket_number}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Checkbox for unassigned tickets */}
                      {!ticket.assigned_to && (
                        <CustomCheckbox
                          checked={selectedTickets.includes(ticket.ticket_number)}
                          onChange={() => handleSelectTicket(ticket.ticket_number)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 z-10 relative"
                          aria-label={`Select ticket ${ticket.ticket_number}`}
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-mono font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {ticket.ticket_number}
                          </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityIcon(ticket.priority)}
                          <span className="ml-1">{ticket.priority}</span>
                        </span>
                        {!ticket.assigned_to && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                            Unassigned
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-1">{ticket.brand_name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {ticket.description || 'No description provided'}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Created by: {ticket.creator_name}</span>
                        <span>•</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        {ticket.assigned_to_name && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">Assigned to: {ticket.assigned_to_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrow indicator on hover */}
                  <div className="ml-4">
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>

              {/* Assignment Actions - Outside of Link to prevent navigation */}
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
            </div>
            ))}
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
};

export default IncomingTickets;
