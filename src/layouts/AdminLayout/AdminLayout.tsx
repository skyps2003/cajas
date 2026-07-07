import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export const AdminLayout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--sidebar-bg)] border-b border-[var(--sidebar-border)] z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-night-blue flex items-center justify-center">
            <span className="text-white font-bold text-sm">JJ</span>
          </div>
          <span className="font-bold text-[var(--sidebar-text-hover)] text-lg">Corp. JJJA</span>
        </div>
        <button onClick={toggleMobileSidebar} className="p-2 rounded-md text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-hover)] transition-colors">
          <Menu size={24} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          toggleSidebar={toggleSidebar} 
          role="admin"
          isMobileOpen={isMobileSidebarOpen}
          toggleMobileSidebar={toggleMobileSidebar}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
