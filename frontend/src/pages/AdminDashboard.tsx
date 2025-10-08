import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { ticketService } from '../services/ticketService';
import { userService } from '../services/userService';
import { 
  Users, 
  Ticket, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Activity,
  FileText,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen animate-scale-in">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: userService.getAllUsers,
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => ticketService.getTickets({}),
  });

  // Calculate statistics
  const openTicketsList = ticketsData?.tickets.filter(t => t.status === 'open' || t.status === 're-opened') || [];
  
  const stats = {
    totalUsers: usersData?.users.length || 0,
    growthUsers: usersData?.users.filter(u => u.role === 'growth').length || 0,
    opsUsers: usersData?.users.filter(u => u.role === 'ops').length || 0,
    adminUsers: usersData?.users.filter(u => u.role === 'admin').length || 0,
    totalTickets: ticketsData?.tickets.length || 0,
    openTickets: openTicketsList.length,
    processedTickets: ticketsData?.tickets.filter(t => t.status === 'processed').length || 0,
    resolvedTickets: ticketsData?.tickets.filter(t => t.status === 'resolved').length || 0,
    closedTickets: ticketsData?.tickets.filter(t => t.status === 'closed').length || 0,
    urgentOpenTickets: openTicketsList.filter(t => t.priority === 'urgent').length,
    highOpenTickets: openTicketsList.filter(t => t.priority === 'high').length,
    mediumOpenTickets: openTicketsList.filter(t => t.priority === 'medium').length,
    lowOpenTickets: openTicketsList.filter(t => t.priority === 'low').length,
  };

  const resolutionRate = stats.totalTickets > 0 
    ? Math.round(((stats.resolvedTickets + stats.closedTickets) / stats.totalTickets) * 100)
    : 0;

  // Determine highest priority display for open tickets
  const getOpenTicketsPriorityDisplay = () => {
    if (stats.urgentOpenTickets > 0) {
      return { count: stats.urgentOpenTickets, label: 'urgent priority', color: 'text-red-600' };
    } else if (stats.highOpenTickets > 0) {
      return { count: stats.highOpenTickets, label: 'high priority', color: 'text-orange-600' };
    } else if (stats.mediumOpenTickets > 0) {
      return { count: stats.mediumOpenTickets, label: 'medium priority', color: 'text-yellow-600' };
    } else if (stats.lowOpenTickets > 0) {
      return { count: stats.lowOpenTickets, label: 'low priority', color: 'text-green-600' };
    }
    return null;
  };

  const priorityDisplay = getOpenTicketsPriorityDisplay();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center mb-2">
            <Shield className="w-7 h-7 mr-2 text-purple-600" />
            <span className="text-gradient">Admin Dashboard</span>
          </h1>
          <p className="text-base text-gray-600">System overview and management</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-xl font-semibold">
            <Activity className="w-4 h-4 mr-2 animate-pulse" />
            System Online
          </span>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Link 
          to="/admin/users" 
          className="card-modern card-interactive animate-slide-in-right" 
          style={{animationDelay: '0ms'}}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Users</p>
              <p className="text-5xl font-extrabold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
            <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>{stats.growthUsers} Growth</span>
            <span className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>{stats.opsUsers} Ops</span>
            <span className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>{stats.adminUsers} Admin</span>
          </div>
          <div className="mt-3 flex items-center justify-end text-indigo-600 font-semibold text-sm">
            View All Users <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>

        {/* Total Tickets */}
        <Link 
          to="/tickets?includeResolved=true" 
          className="card-modern card-interactive animate-slide-in-right" 
          style={{animationDelay: '100ms'}}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Total Tickets</p>
              <p className="text-5xl font-extrabold text-gray-900">{stats.totalTickets}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium mb-3">All time created</p>
          <div className="flex items-center justify-end text-indigo-600 font-semibold text-sm">
            View All Tickets <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>

        {/* Open Tickets */}
        <Link 
          to="/tickets?status=open,re-opened" 
          className="card-modern card-interactive animate-slide-in-right" 
          style={{animationDelay: '200ms'}}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Open Tickets</p>
              <p className="text-5xl font-extrabold text-gray-900">{stats.openTickets}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </div>
          {priorityDisplay ? (
            <p className={`text-xs font-bold mb-3 ${priorityDisplay.color}`}>
              {priorityDisplay.count} {priorityDisplay.label}
            </p>
          ) : (
            <p className="text-xs text-gray-500 font-medium mb-3">No open tickets</p>
          )}
          <div className="flex items-center justify-end text-indigo-600 font-semibold text-sm">
            View Open Tickets <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>

        {/* Resolution Rate */}
        <Link 
          to="/tickets?status=resolved,closed&includeResolved=true" 
          className="card-modern card-interactive animate-slide-in-right" 
          style={{animationDelay: '300ms'}}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Resolution Rate</p>
              <p className="text-5xl font-extrabold text-gray-900">{resolutionRate}%</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-500 font-medium mb-3">{stats.resolvedTickets + stats.closedTickets} resolved/closed</p>
          <div className="flex items-center justify-end text-indigo-600 font-semibold text-sm">
            View Resolved <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Status Chart */}
        <div className="card-modern animate-slide-in-left">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-indigo-600" />
              Ticket Status Breakdown
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Open', count: stats.openTickets, gradient: 'from-blue-500 to-cyan-500', total: stats.totalTickets, link: '/tickets?status=open' },
              { label: 'Processed', count: stats.processedTickets, gradient: 'from-yellow-500 to-orange-500', total: stats.totalTickets, link: '/tickets?status=processed' },
              { label: 'Resolved', count: stats.resolvedTickets, gradient: 'from-green-500 to-emerald-500', total: stats.totalTickets, link: '/tickets?status=resolved&includeResolved=true' },
              { label: 'Closed', count: stats.closedTickets, gradient: 'from-gray-500 to-gray-600', total: stats.totalTickets, link: '/tickets?status=closed&includeResolved=true' },
            ].map((item, index) => (
              <Link 
                key={item.label} 
                to={item.link}
                className="block animate-slide-in-right hover:opacity-80 transition-opacity" 
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                  <div 
                    className={`h-full bg-gradient-to-r ${item.gradient} transition-all duration-1000`}
                    style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-modern animate-slide-in-right">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-indigo-600" />
              Quick Actions
            </h2>
          </div>
          <div className="space-y-3">
            <Link
              to="/admin/users"
              className="group flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl border-2 border-transparent hover:border-purple-300 transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-500">Create, edit, delete accounts</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/tickets"
              className="group flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 rounded-xl border-2 border-transparent hover:border-indigo-300 transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">View All Tickets</p>
                  <p className="text-xs text-gray-500">Monitor and manage tickets</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/admin/settings"
              className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 rounded-xl border-2 border-transparent hover:border-gray-300 transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-slate-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">System Settings</p>
                  <p className="text-xs text-gray-500">Configure system preferences</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="card-modern animate-slide-in-left">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Users</h2>
            <p className="text-sm text-gray-500 mt-1">Latest registered accounts</p>
          </div>
          <Link
            to="/users"
            className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group"
          >
            View all
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">User</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersData?.users.slice(0, 5).map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors animate-slide-in-right" style={{animationDelay: `${index * 50}ms`}}>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-semibold text-gray-900">{user.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white ${
                      user.role === 'admin' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                      user.role === 'ops' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                      'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}