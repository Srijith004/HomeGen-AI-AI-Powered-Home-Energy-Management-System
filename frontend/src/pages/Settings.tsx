import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Home,
  Receipt,
  Cpu,
  Database,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Save,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { Badge } from '../components/common/Badge';

export const Settings: React.FC = () => {
  const {
    household,
    updateHousehold,
    tariffSettings,
    updateTariffSettings,
    theme,
    toggleTheme,
    currency,
    timeZone,
    exportBackup,
    importBackup,
    resetAll,
    clearDataset,
    datasets,
  } = useEnergy();

  // Local form state
  const [householdName, setHouseholdName] = useState(household.name);
  const [bedrooms, setBedrooms] = useState(household.bedrooms);
  const [livingRooms, setLivingRooms] = useState(household.livingRooms);
  const [kitchens, setKitchens] = useState(household.kitchens);
  const [bathrooms, setBathrooms] = useState(household.bathrooms);

  // Status messages
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Destructive confirmation state
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmClearDataOpen, setConfirmClearDataOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveHousehold = (e: React.FormEvent) => {
    e.preventDefault();
    updateHousehold({
      name: householdName,
      bedrooms,
      livingRooms,
      kitchens,
      bathrooms,
    });
    setStatusMessage({ type: 'success', text: 'Household profile updated successfully.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `homegen_ai_backup_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: 'Application state backup downloaded.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = importBackup(content);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Application state restored from JSON backup.' });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to import backup file.' });
      }
      setTimeout(() => setStatusMessage(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings & Data Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure residence profile, tariff structures, display preferences, and LocalStorage data management.
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-teal-500/10 border-teal-500/20 text-teal-800 dark:text-teal-300'
              : 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. HOUSEHOLD PROFILE CONFIGURATION */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Home className="w-5 h-5 text-teal-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Household Configuration
            </h2>
          </div>

          <form onSubmit={handleSaveHousehold} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Household Name</label>
              <input
                type="text"
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Bedrooms</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={bedrooms}
                  onChange={e => setBedrooms(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Living Rooms</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={livingRooms}
                  onChange={e => setLivingRooms(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kitchens</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={kitchens}
                  onChange={e => setKitchens(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Bathrooms</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={bathrooms}
                  onChange={e => setBathrooms(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold transition"
              >
                <Save className="w-4 h-4" />
                <span>Save Household Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. APPLICATION & DISPLAY PREFERENCES */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <SettingsIcon className="w-5 h-5 text-teal-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Application Preferences
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Theme Mode</span>
                <span className="text-slate-400">Current appearance: {theme.toUpperCase()}</span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
            </div>

            {/* Currency and Locale Display */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Primary Currency</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white mt-1 block">
                  {currency} (Indian Rupee)
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Default Time Zone</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white mt-1 block">
                  {timeZone}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Storage Medium</span>
              <span className="font-semibold text-slate-900 dark:text-white mt-1 block">
                Browser LocalStorage (Key: <code className="font-mono text-teal-400">homegen_ai_state_v1</code>)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DATA MANAGEMENT & BACKUP HUB */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-5 h-5 text-teal-500" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Data Persistence & Migration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export and import state backups as JSON to migrate configurations across devices.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Backup Download */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Export JSON State Backup
              </span>
              <p className="text-slate-400 mt-1">
                Downloads household profile, appliances, tariff rules, and generated synthetic records into a JSON backup.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="py-2 px-3 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Backup Import */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Restore State from Backup
              </span>
              <p className="text-slate-400 mt-1">
                Upload a verified <code className="font-mono text-teal-400">.json</code> backup to restore household and telemetry states.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Upload JSON Backup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Destructive Actions Strip */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              Danger Zone Operations
            </span>
            <span className="text-slate-400">
              Clear generated synthetic data or perform a complete factory reset.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfirmClearDataOpen(true)}
              className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 font-semibold transition"
            >
              Clear Synthetic Dataset ({datasets.length})
            </button>

            <button
              onClick={() => setConfirmResetOpen(true)}
              className="px-3 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 font-semibold transition"
            >
              Factory Reset Application
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODALS */}
      {confirmClearDataOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 text-xs">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Clear Synthetic Dataset?
            </h3>
            <p className="text-slate-400">
              This will erase all {datasets.length} generated synthetic records from LocalStorage. Your appliance configuration will remain intact.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmClearDataOpen(false)}
                className="px-4 py-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearDataset();
                  setConfirmClearDataOpen(false);
                  setStatusMessage({ type: 'success', text: 'Synthetic records cleared.' });
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-600 transition"
              >
                Clear Records
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 text-xs">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Factory Reset HomeGen AI?
            </h3>
            <p className="text-slate-400">
              This will restore all default 3BHK appliances, reset tariff schedules, and regenerate the initial demonstration dataset.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAll();
                  setConfirmResetOpen(false);
                  setStatusMessage({ type: 'success', text: 'Application restored to default factory state.' });
                }}
                className="px-4 py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
