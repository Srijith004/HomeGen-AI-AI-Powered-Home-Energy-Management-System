import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { AlertCircle } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-[#0B1220] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Educational Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-teal-200 text-[11px] px-4 py-1.5 flex items-center justify-center gap-2 border-b border-teal-800/40 select-none">
        <AlertCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
        <span className="font-medium">
          ACADEMIC PROJECT DEMONSTRATION: Software-only simulated energy model for 3BHK Indian residential household.
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
