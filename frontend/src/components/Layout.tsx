import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Ticket, Plus, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">
                Escalation Portal
              </h1>
              
              <nav className="flex space-x-4">
                <Link
                  to="/"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/') 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                
                <Link
                  to="/tickets"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/tickets') 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  Tickets
                </Link>
                
                {user?.role === 'growth' && (
                  <Link
                    to="/tickets/new"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/tickets/new') 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name || user?.email}</p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
