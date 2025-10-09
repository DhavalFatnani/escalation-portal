import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Home, Ticket, Plus, Users, LogOut, Shield, ChevronDown, FileX, User } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attachmentService } from '../services/attachmentService';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get pending deletion requests count for badge
  const { data: pendingRequestsData } = useQuery({
    queryKey: ['deletion-requests-pending-count'],
    queryFn: () => attachmentService.getPendingRequests(),
    refetchInterval: 60000, // Refresh every minute
  });

  const pendingCount = pendingRequestsData?.requests?.length || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      {/* Header with subtle shadow */}
      <header className="glass sticky top-0 z-50 border-b border-white/50">
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                <img src="/logo.svg" alt="KNOT Logo" className="w-12 h-12 rounded-xl" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Escalation Portal
              </h1>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <Link
                to="/"
                className={`flex items-center px-4 py-2.5 rounded-lg font-medium transition-all ${
                  isActive('/') && location.pathname === '/'
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {user?.role === 'admin' ? (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    <span>Admin</span>
                  </>
                ) : (
                  <>
                    <Home className="w-5 h-5 mr-2" />
                    <span>Dashboard</span>
                  </>
                )}
              </Link>

              <Link
                to="/tickets"
                className={`flex items-center px-4 py-2.5 rounded-lg font-medium transition-all ${
                  isActive('/tickets') && location.pathname === '/tickets'
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Ticket className="w-5 h-5 mr-2" />
                <span>Tickets</span>
              </Link>

              <Link
                to="/deletion-requests"
                className={`flex items-center px-4 py-2.5 rounded-lg font-medium transition-all relative ${
                  isActive('/deletion-requests')
                    ? 'bg-orange-100 text-orange-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileX className="w-5 h-5 mr-2" />
                <span>Approvals</span>
                {pendingCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>

              {(user?.role === 'growth' || user?.role === 'ops') && (
                <Link
                  to="/tickets/new"
                  className={`flex items-center px-4 py-2.5 rounded-lg font-medium transition-all ${
                    isActive('/tickets/new')
                      ? 'bg-green-100 text-green-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  <span>New</span>
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/users"
                  className={`flex items-center px-4 py-2.5 rounded-lg font-medium transition-all ${
                    isActive('/users')
                      ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-5 h-5 mr-2" />
                  <span>Users</span>
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100/80 transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-semibold text-white">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-20">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-5rem)]">
        <div className="w-full px-4 sm:px-6 lg:px-12 py-6">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/50 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-12 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 Escalation Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
