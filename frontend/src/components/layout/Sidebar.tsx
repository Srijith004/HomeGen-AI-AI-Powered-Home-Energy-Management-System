import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Database,
  BarChart3,
  Receipt,
  TrendingUp,
  Home,
  Sparkles,
  TableProperties,
  FileSpreadsheet,
  Settings,
  Info,
  X,
  Zap,
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { name: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Appliance Management', path: '/appliances', icon: Cpu },
  { name: 'Synthetic Data Generator', path: '/generator', icon: Database },
  { name: 'Energy Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Electricity Bill Estimator', path: '/billing', icon: Receipt },
  { name: 'AI Energy Prediction', path: '/predictions', icon: TrendingUp },
  { name: 'Smart Home Simulator', path: '/simulator', icon: Home },
  { name: 'Gemini AI Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'AI' },
  { name: 'Dataset Explorer', path: '/explorer', icon: TableProperties },
  { name: 'Reports & Export', path: '/reports', icon: FileSpreadsheet },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'About Project', path: '/about', icon: Info },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar aside element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#FFFFFF] dark:bg-[#0B1220] border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                HomeGen AI
              </span>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-teal-600 dark:text-teal-400">
                HEMS Academic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tagline */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-[#111C2E]/60 border-b border-slate-200 dark:border-slate-800/50">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center tracking-wide">
            Monitor. Control. Predict. Optimize.
          </p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/15 to-emerald-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <Badge variant="teal" size="sm">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Simulation Notice Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#111C2E]/40">
          <div className="rounded-lg p-2.5 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-teal-600 dark:text-teal-400 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Simulation Mode Active</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
              No physical IoT or meter connection. Pure software simulation for academic demonstration.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
