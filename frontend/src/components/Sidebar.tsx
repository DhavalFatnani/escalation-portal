import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { managerService } from '../services/managerService';
import { attachmentService } from '../services/attachmentService';
import { ticketService } from '../services/ticketService';
import PWAInstallPrompt from './PWAInstallPrompt';
import FullscreenToggle from './FullscreenToggle';
import { 
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  Plus,
  Send,
  Shield,
  ChevronDown,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Home,
  FolderOpen,
  UserCheck,
  Cog,
  Bell,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  action?: string; // For special actions like logout
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const [expandedGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-expanded-groups');
    return saved ? JSON.parse(saved) : ['Overview', 'Tickets', 'My Work'];
  });

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('[data-user-menu]')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Fetch badge counts
  const { data: incomingCount = 0 } = useQuery({
    queryKey: ['incoming-count'],
    queryFn: async () => {
      const data = await managerService.getIncomingTickets();
      return data.tickets.filter(t => !t.assigned_to).length;
    },
    refetchInterval: 30000,
    enabled: (user?.is_manager || user?.role === 'admin') ?? false
  });

  const { data: approvalCount = 0 } = useQuery({
    queryKey: ['approval-count'],
    queryFn: async () => {
      const data = await attachmentService.getPendingRequests();
      return data.requests?.length || 0;
    },
    refetchInterval: 30000
  });

  // Get count of tickets assigned to this team member (for non-managers only)
  const { data: assignedCount = 0 } = useQuery({
    queryKey: ['assigned-count'],
    queryFn: async () => {
      const data = await ticketService.getTickets({ 
        assigned_to: user?.id,
        status: ['open', 're-opened', 'processed']
      });
      return data.tickets.length;
    },
    refetchInterval: 30000,
    enabled: (!user?.is_manager && user?.role !== 'admin') ?? false
  });

  // Badge values mapping
  const badgeValues: Record<string, number> = {
    incomingCount,
    approvalCount,
    assignedCount
  };

  // Persist sidebar state and notify parent
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isSidebarCollapsed.toString());
    if (onToggle) {
      onToggle(isSidebarCollapsed);
    }
  }, [isSidebarCollapsed, onToggle]);

  useEffect(() => {
    localStorage.setItem('sidebar-expanded-groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);


  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Navigation groups based on user role
  const getNavigationGroups = (): NavigationGroup[] => {
    if (user?.role === 'admin') {
      return [
        {
          label: 'Overview',
          items: [{ path: '/', label: 'Admin Dashboard', icon: Home }]
        },
        {
          label: 'Ticket Management',
          items: [
            { path: '/tickets', label: 'All Tickets', icon: FolderOpen },
            { path: '/tickets/new', label: 'Create Ticket', icon: Plus }
          ]
        },
        {
          label: 'Administration',
          items: [
            { path: '/users', label: 'User Management', icon: UserCheck },
            { path: '/admin/settings', label: 'System Settings', icon: Cog },
            { path: '/deletion-requests', label: 'Deletion Requests', icon: Bell, badge: 'approvalCount' }
          ]
        }
      ];
    } else if (user?.is_manager) {
      return [
        {
          label: 'Overview',
          items: [{ path: '/', label: 'Manager Dashboard', icon: Home }]
        },
        {
          label: 'Ticket Flow',
          items: [
            { path: '/incoming', label: 'Incoming Tickets', icon: ArrowDownCircle, badge: 'incomingCount' },
            { path: '/outgoing', label: 'Outgoing Tickets', icon: ArrowUpCircle }
          ]
        },
        {
          label: 'Team Management',
          items: [
            { path: '/my-team', label: 'Team Members', icon: Users },
            { path: '/team-performance', label: 'Performance Analytics', icon: TrendingUp }
          ]
        },
        {
          label: 'Quick Actions',
          items: [
            { path: '/tickets/new', label: 'Create Ticket', icon: Plus },
            { path: '/deletion-requests', label: 'Approvals', icon: Bell, badge: 'approvalCount' }
          ]
        }
      ];
    } else {
      // Team member
      return [
        {
          label: 'Overview',
          items: [
            { path: '/', label: 'My Work Dashboard', icon: Home }
          ]
        },
        {
          label: 'My Tickets',
          items: [
            { path: '/assigned-to-me', label: 'Assigned to Me', icon: CheckCircle2, badge: 'assignedCount' },
            { path: '/my-escalations', label: 'My Escalations', icon: Send }
          ]
        },
        {
          label: 'Quick Actions',
          items: [
            { path: '/tickets/new', label: 'Create Ticket', icon: Plus },
            { path: '/deletion-requests', label: 'Approvals', icon: Bell, badge: 'approvalCount' }
          ]
        }
      ];
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationGroups = getNavigationGroups();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white/90 backdrop-blur-sm text-slate-800 rounded-2xl shadow-xl border border-slate-200 hover:scale-105 transition-all duration-200"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'w-16' : 'w-72'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          bg-white border-r border-slate-200 shadow-xl overflow-hidden
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className={`flex items-center space-x-3 transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 scale-0 w-0' : 'opacity-100 scale-100'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-800">Escalation Portal</h2>
                <p className="text-xs text-slate-500 capitalize">{user?.role} Portal</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            {navigationGroups.map((group) => (
              <div key={group.label} className="mb-6">
                {/* Group Header */}
                <div className={`px-3 mb-3 transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 h-0 mb-0' : 'opacity-100 h-auto'}`}>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {group.label}
                  </h3>
                </div>

                {/* Group Items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const badgeValue = item.badge ? badgeValues[item.badge] : 0;
                    const active = isActive(item.path);

                    // Handle logout action
                    if (item.action === 'logout') {
                      return (
                        <button
                          key={item.path}
                          onClick={handleLogout}
                          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                        >
                          <Icon className="w-5 h-5 flex-shrink-0 mr-3" />
                          <span className={`flex-1 text-left transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                            {item.label}
                          </span>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                          flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out group relative
                          ${active 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 mr-3 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                        
                        <span className={`flex-1 text-left transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                          {item.label}
                        </span>
                        {badgeValue > 0 && (
                          <span className={`
                            px-2 py-1 text-xs font-bold rounded-full transition-all duration-300
                            ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}
                            ${active 
                              ? 'bg-white/20 text-white' 
                              : 'bg-blue-500 text-white'
                            }
                          `}>
                            {badgeValue}
                          </span>
                        )}

                        {/* Tooltip for collapsed state */}
                        {isSidebarCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {item.label}
                            {badgeValue > 0 && (
                              <span className="ml-1 px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                {badgeValue}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white space-y-3">
            {/* PWA Install Prompt */}
            <PWAInstallPrompt collapsed={isSidebarCollapsed} />
            
            {/* Fullscreen Toggle - Animate above dropdown when profile menu is open */}
            <div className={`transition-all duration-300 ease-in-out ${showUserMenu ? 'transform -translate-y-32 z-[60]' : 'z-10'}`}>
              <FullscreenToggle collapsed={isSidebarCollapsed} />
            </div>
            
            {/* User Info - Clickable */}
            <div className="relative" data-user-menu>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-full bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group ${
                  isSidebarCollapsed ? 'p-2 flex justify-center' : 'p-3'
                }`}
                title={isSidebarCollapsed ? "Account Menu" : undefined}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg flex-shrink-0">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className={`flex-1 min-w-0 text-left transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                    <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                  </div>
                  
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-all duration-300 flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''} ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`} />
                </div>
                
                {user?.is_manager && (
                  <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 h-0 mt-0' : 'opacity-100 h-auto mt-2'}`}>
                    <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-sm">
                      👔 Manager
                    </span>
                  </div>
                )}
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className={`absolute ${isSidebarCollapsed ? 'left-full ml-2' : 'bottom-full mb-2'} ${isSidebarCollapsed ? 'left-0' : 'left-0 right-0'} bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-[40] animate-modal-in`}>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 mr-3 text-slate-500" />
                      <span>Profile Settings</span>
                    </Link>
                    
                    <div className="border-t border-slate-200 my-1" />
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      <span>Logout</span>
                    </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

