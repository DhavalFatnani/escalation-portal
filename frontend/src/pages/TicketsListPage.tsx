import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ticketService } from '../services/ticketService';
import { Search, Filter } from 'lucide-react';
import { TicketStatus, TicketPriority } from '../types';

export default function TicketsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  
  const statusFilter = searchParams.get('status')?.split(',') as TicketStatus[] | undefined;
  const priorityFilter = searchParams.get('priority')?.split(',') as TicketPriority[] | undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', statusFilter, priorityFilter, search],
    queryFn: () => ticketService.getTickets({
      status: statusFilter,
      priority: priorityFilter,
      search,
    }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const toggleFilter = (type: 'status' | 'priority', value: string) => {
    const params = new URLSearchParams(searchParams);
    const current = params.get(type)?.split(',').filter(Boolean) || [];
    
    if (current.includes(value)) {
      const updated = current.filter((v) => v !== value);
      if (updated.length > 0) {
        params.set(type, updated.join(','));
      } else {
        params.delete(type);
      }
    } else {
      params.set(type, [...current, value].join(','));
    }
    
    setSearchParams(params);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'text-blue-700 bg-blue-100';
      case 'processed': return 'text-yellow-700 bg-yellow-100';
      case 'resolved': return 'text-green-700 bg-green-100';
      case 're-opened': return 'text-red-700 bg-red-100';
      case 'closed': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tickets</h1>
        <p className="text-gray-600">View and manage all escalation tickets</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticket number, brand, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex items-start gap-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {(['open', 'processed', 're-opened', 'resolved'] as TicketStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => toggleFilter('status', status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter?.includes(status)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              Priority
            </p>
            <div className="flex flex-wrap gap-2">
              {(['urgent', 'high', 'medium', 'low'] as TicketPriority[]).map((priority) => (
                <button
                  key={priority}
                  onClick={() => toggleFilter('priority', priority)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    priorityFilter?.includes(priority)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {data?.total || 0} Tickets
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            Loading tickets...
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data?.tickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.ticket_number}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <p className="text-sm font-mono font-medium text-gray-900">
                        {ticket.ticket_number}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium mb-1">
                      {ticket.brand_name}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {ticket.description || 'No description'}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span>Created by {ticket.creator_name || ticket.creator_email}</span>
                      {ticket.assignee_name && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Assigned to {ticket.assignee_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(ticket.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {(!data?.tickets || data.tickets.length === 0) && (
              <div className="px-6 py-12 text-center text-gray-500">
                No tickets found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
