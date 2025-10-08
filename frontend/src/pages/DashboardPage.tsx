import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../services/ticketService';
import { Link } from 'react-router-dom';
import { Ticket, AlertCircle, Clock, CheckCircle, Plus } from 'lucide-react';
import { TicketStatus } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  
  const { data: openTickets } = useQuery({
    queryKey: ['tickets', 'open'],
    queryFn: () => ticketService.getTickets({ status: ['open'] }),
  });

  const { data: processedTickets } = useQuery({
    queryKey: ['tickets', 'processed'],
    queryFn: () => ticketService.getTickets({ status: ['processed'] }),
  });

  const { data: reopenedTickets } = useQuery({
    queryKey: ['tickets', 'reopened'],
    queryFn: () => ticketService.getTickets({ status: ['re-opened'] }),
  });

  const { data: recentTickets } = useQuery({
    queryKey: ['tickets', 'recent'],
    queryFn: () => ticketService.getTickets({ }),
  });

  const stats = [
    {
      name: 'Open Tickets',
      value: openTickets?.total || 0,
      icon: Ticket,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/tickets?status=open',
    },
    {
      name: 'Awaiting Review',
      value: processedTickets?.total || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      link: '/tickets?status=processed',
    },
    {
      name: 'Re-opened',
      value: reopenedTickets?.total || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      link: '/tickets?status=re-opened',
    },
  ];

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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || user?.email}</p>
        </div>
        
        {user?.role === 'growth' && (
          <Link
            to="/tickets/new"
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentTickets?.tickets.slice(0, 10).map((ticket) => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.ticket_number}`}
              className="block px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <p className="text-sm font-medium text-gray-900">
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
                  <p className="text-sm text-gray-500 truncate">
                    {ticket.description || 'No description'}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {(!recentTickets?.tickets || recentTickets.tickets.length === 0) && (
            <div className="px-6 py-8 text-center text-gray-500">
              No tickets found
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Link
            to="/tickets"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all tickets →
          </Link>
        </div>
      </div>
    </div>
  );
}
