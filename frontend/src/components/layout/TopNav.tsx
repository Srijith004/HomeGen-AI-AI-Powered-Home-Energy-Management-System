import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Zap,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Menu,
} from 'lucide-react';
import { useEnergy } from '../../context/EnergyContext';
import { Badge } from '../common/Badge';

interface TopNavProps {
  onToggleSidebar?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme, totalCurrentPowerDemandKW, appliances } = useEnergy();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format in Asia/Kolkata IST
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setCurrentTime(now.toLocaleString('en-IN', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = appliances.filter(a => a.status === 'ON' && a.isEnabled).length;

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/90 dark:bg-[#0B1220]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-lg text-slate-950 shadow-sm shadow-teal-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent">
                HomeGen AI
              </span>
              <span className="hidden sm:inline-block">
                <Badge variant="teal" size="sm" pulse>
                  SIMULATED
                </Badge>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Intelligent Home Energy Management System
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-mono">{currentTime || 'Asia/Kolkata'}</span>
        </div>

        {/* Live Demand Pill */}
        <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
          <span className="text-slate-400">Demand:</span>
          <span className="font-mono font-bold text-teal-500 dark:text-teal-400">
            {totalCurrentPowerDemandKW.toFixed(3)} kW
          </span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-white dark:ring-[#0B1220]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                <span>Simulation Activity & Alerts</span>
                <span className="text-[10px] text-teal-400 font-normal">Live System</span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Active Simulation Engine</p>
                    <p className="text-[11px] text-slate-400">
                      {activeCount} active simulated appliances consuming {totalCurrentPowerDemandKW.toFixed(2)} kW.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Educational Simulation Notice</p>
                    <p className="text-[11px] text-slate-400">
                      All electrical readings and control states are mathematical simulations.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="mt-3 w-full py-1 text-center text-[11px] text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle color theme"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* User Profile Tag */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700/60">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-semibold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Home Owner</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">3BHK Residence</p>
          </div>
        </div>
      </div>
    </header>
  );
};
