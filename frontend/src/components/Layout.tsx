import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      {/* Sidebar */}
      <Sidebar onToggle={handleSidebarToggle} />
      
      {/* Main Content Wrapper - margin adjusts based on sidebar state */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-[280px]'
        }`}
      >
      {/* Main Content */}
        <main className="flex-1 px-8 py-8 overflow-auto">
          <Outlet />
      </main>
        </div>
    </div>
  );
}
