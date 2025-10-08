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
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
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
  const stats = {
    totalUsers: usersData?.users.length || 0,
    growthUsers: usersData?.users.filter(u => u.role === 'growth').length || 0,
    opsUsers: usersData?.users.filter(u => u.role === 'ops').length || 0,
    adminUsers: usersData?.users.filter(u => u.role === 'admin').length || 0,
    totalTickets: ticketsData?.tickets.length || 0,
    openTickets: ticketsData?.tickets.filter(t => t.status === 'open').length || 0,
    processedTickets: ticketsData?.tickets.filter(t => t.status === 'processed').length || 0,
    resolvedTickets: ticketsData?.tickets.filter(t => t.status === 'resolved').length || 0,
    closedTickets: ticketsData?.tickets.filter(t => t.status === 'closed').length || 0,
    urgentTickets: ticketsData?.tickets.filter(t => t.priority === 'urgent').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          System overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.growthUsers} Growth • {stats.opsUsers} Ops • {stats.adminUsers} Admin
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Tickets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTickets}</p>
              <p className="text-xs text-gray-500 mt-1">
                All time
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.openTickets}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.urgentTickets} urgent
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.resolvedTickets + stats.closedTickets}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalTickets > 0 
                  ? Math.round(((stats.resolvedTickets + stats.closedTickets) / stats.totalTickets) * 100)
                  : 0}% resolution rate
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Status Breakdown</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-700">Open</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: stats.totalTickets > 0 ? `${(stats.openTickets / stats.totalTickets) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-12 text-right">{stats.openTickets}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-700">Processed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: stats.totalTickets > 0 ? `${(stats.processedTickets / stats.totalTickets) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-12 text-right">{stats.processedTickets}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-700">Resolved</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: stats.totalTickets > 0 ? `${(stats.resolvedTickets / stats.totalTickets) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-12 text-right">{stats.resolvedTickets}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
              <span className="text-sm font-medium text-gray-700">Closed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full" 
                  style={{ width: stats.totalTickets > 0 ? `${(stats.closedTickets / stats.totalTickets) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-12 text-right">{stats.closedTickets}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Create, edit, and manage user accounts across all roles
          </p>
          <div className="text-sm font-medium text-blue-600">
            Manage Users →
          </div>
        </Link>

        <Link
          to="/tickets"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">All Tickets</h3>
            <Ticket className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            View and manage all tickets with advanced admin controls
          </p>
          <div className="text-sm font-medium text-purple-600">
            View Tickets →
          </div>
        </Link>

        <Link
          to="/admin/system"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow opacity-60 cursor-not-allowed"
          onClick={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Configure system settings and integrations (Coming Soon)
          </p>
          <div className="text-sm font-medium text-gray-400">
            Coming Soon
          </div>
        </Link>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
          <Link to="/users" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usersData?.users.slice(0, 5).map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'ops' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
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
