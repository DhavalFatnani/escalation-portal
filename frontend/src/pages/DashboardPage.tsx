import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../services/ticketService';
import { Link } from 'react-router-dom';
import { Ticket, AlertCircle, Clock, Plus, TrendingUp, ArrowRight } from 'lucide-react';
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
    queryFn: () => ticketService.getTickets({ status: ['open', 'processed', 're-opened'] }),
  });

  const stats = [
    {
      name: 'Open Tickets',
      value: openTickets?.total || 0,
      icon: Ticket,
      gradient: 'from-blue-500 to-cyan-500',
      link: '/tickets?status=open',
      description: 'Needs attention',
    },
    {
      name: 'Awaiting Review',
      value: processedTickets?.total || 0,
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
      link: '/tickets?status=processed',
      description: 'In progress',
    },
    {
      name: 'Re-opened',
      value: reopenedTickets?.total || 0,
      icon: AlertCircle,
      gradient: 'from-red-500 to-pink-500',
      link: '/tickets?status=re-opened',
      description: 'Requires action',
    },
  ];

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
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Welcome back, <span className="font-semibold text-gray-900">{user?.name || user?.email}</span> 👋
          </p>
        </div>
        
        {user?.role === 'growth' && (
          <Link
            to="/tickets/new"
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="card-modern group hover:-translate-y-2 animate-slide-in-right"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{stat.name}</p>
                <p className="text-5xl font-extrabold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.description}</p>
              </div>
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000`}
                style={{ width: `${Math.min((stat.value / 20) * 100, 100)}%` }}
              ></div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Tickets */}
      <div className="card-modern animate-slide-in-left">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              Recent Tickets
              <TrendingUp className="w-6 h-6 ml-2 text-indigo-600" />
            </h2>
            <p className="text-sm text-gray-500 mt-1">Latest updates across all tickets</p>
          </div>
          <Link
            to="/tickets"
            className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group"
          >
            View all
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {recentTickets?.tickets.slice(0, 10).map((ticket, index) => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.ticket_number}`}
              className="block p-5 bg-gray-50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-200 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-900 font-mono bg-white px-3 py-1 rounded-lg shadow-sm">
                      {ticket.ticket_number}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${getPriorityColor(ticket.priority)} shadow-sm`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">
                    {ticket.brand_name}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {ticket.description || 'No description'}
                  </p>
                </div>
                <div className="ml-4 flex flex-col items-end">
                  <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full">
                    {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all mt-2" />
                </div>
              </div>
            </Link>
          ))}

          {(!recentTickets?.tickets || recentTickets.tickets.length === 0) && (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Ticket className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No tickets found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first ticket to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}