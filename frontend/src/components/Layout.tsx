import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Ticket, Plus, LogOut, Users, Shield, Sparkles, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'ops':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'growth':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header with Gradient */}
      <header className="glass sticky top-0 z-50 border-b border-white/20 shadow-xl">
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center h-18">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">
                  Escalation Portal
                </h1>
                <p className="text-xs text-gray-500">Growth ↔ Ops System</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <Link
                to="/"
                className={`group flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive('/') && location.pathname === '/'
                    ? user?.role === 'admin'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {user?.role === 'admin' ? (
                  <>
                    <Shield className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                    <span>Admin</span>
                  </>
                ) : (
                  <>
                    <Home className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                    <span>Dashboard</span>
                  </>
                )}
              </Link>

              <Link
                to="/tickets"
                className={`group flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive('/tickets') && location.pathname === '/tickets'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Ticket className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                <span>Tickets</span>
              </Link>

              {user?.role === 'growth' && (
                <Link
                  to="/tickets/new"
                  className={`group flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive('/tickets/new')
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                  <span>New Ticket</span>
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/users"
                  className={`group flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive('/users')
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                  <span>Users</span>
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-300 group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || user?.email}</p>
                  <div className="flex items-center justify-end space-x-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${getRoleBadgeColor(user?.role || '')} animate-pulse`}></span>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl ${getRoleBadgeColor(user?.role || '')} flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 glass rounded-2xl shadow-xl-colored p-2 animate-scale-in">
                  <div className="px-4 py-3 border-b border-gray-200 mb-2">
                    <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white ${getRoleBadgeColor(user?.role || '')}`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group"
                  >
                    <LogOut className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Background */}
      <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-12 py-6">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/20 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-12 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2024 Escalation Portal. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                System Online
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}