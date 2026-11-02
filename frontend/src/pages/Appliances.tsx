import React, { useState, useMemo } from 'react';
import {
  Plus,
  Power,
  Zap,
  Clock,
  Home,
  Tag,
  Edit2,
  Trash2,
  Filter,
  Sliders,
  DollarSign,
  AlertCircle,
  AirVent,
  Fan,
  Lightbulb,
  Tv,
  WashingMachine,
  Flame,
  CookingPot,
  ChefHat,
  Laptop,
  Wifi,
  Droplet,
  Microwave,
  Check,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { Appliance, ApplianceCategory, OperatingStatus, RoomType } from '../types';
import { ROOMS, CATEGORIES } from '../constants/defaultData';
import { Badge } from '../components/common/Badge';
import { calculateApplianceMonthlyCost } from '../utils/calculations';

export const Appliances: React.FC = () => {
  const {
    appliances,
    toggleApplianceStatus,
    updateAppliance,
    deleteAppliance,
    addAppliance,
    totalCurrentPowerDemandKW,
    tariffSettings,
  } = useEnergy();

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ON' | 'OFF' | 'STANDBY'>('ALL');
  const [roomFilter, setRoomFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered list
  const filteredAppliances = useMemo(() => {
    return appliances.filter(app => {
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
      if (roomFilter !== 'ALL' && app.room !== roomFilter) return false;
      if (categoryFilter !== 'ALL' && app.category !== categoryFilter) return false;
      if (
        searchQuery.trim() !== '' &&
        !app.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !app.room.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [appliances, statusFilter, roomFilter, categoryFilter, searchQuery]);

  const effectiveRate = tariffSettings.mode === 'flat' ? tariffSettings.flatRate : 4.5;

  // Icon selector helper
  const renderApplianceIcon = (iconName?: string, category?: string) => {
    switch (iconName) {
      case 'AirVent':
        return <AirVent className="w-5 h-5 text-teal-400" />;
      case 'Fan':
        return <Fan className="w-5 h-5 text-emerald-400" />;
      case 'Lightbulb':
        return <Lightbulb className="w-5 h-5 text-amber-400" />;
      case 'Tv':
        return <Tv className="w-5 h-5 text-blue-400" />;
      case 'WashingMachine':
        return <WashingMachine className="w-5 h-5 text-indigo-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'CookingPot':
        return <CookingPot className="w-5 h-5 text-amber-400" />;
      case 'ChefHat':
        return <ChefHat className="w-5 h-5 text-orange-400" />;
      case 'Laptop':
        return <Laptop className="w-5 h-5 text-teal-400" />;
      case 'Wifi':
        return <Wifi className="w-5 h-5 text-emerald-400" />;
      case 'Droplet':
        return <Droplet className="w-5 h-5 text-blue-400" />;
      case 'Microwave':
        return <Microwave className="w-5 h-5 text-purple-400" />;
      default:
        return <Zap className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Appliance Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Control simulated appliance operating states, power draws, schedules, and power ratings.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-md shadow-teal-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Appliance</span>
        </button>
      </div>

      {/* Top Banner: Simulated Control Disclaimer */}
      <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3 text-xs text-teal-800 dark:text-teal-200">
        <AlertCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Simulated Control Operation: </span>
          Toggling switches modifies the live simulated household power demand ({totalCurrentPowerDemandKW.toFixed(2)} kW) and recalculates subsequent synthetic generation and billing estimates. No physical loads or IoT relays are triggered.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search appliances by name or room..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ON">ON</option>
              <option value="OFF">OFF</option>
              <option value="STANDBY">Standby</option>
            </select>

            {/* Room Filter */}
            <select
              value={roomFilter}
              onChange={e => setRoomFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Rooms</option>
              {ROOMS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredAppliances.length}</strong> of{' '}
            {appliances.length} appliances
          </span>
          <span>
            Active Operating Load:{' '}
            <strong className="text-teal-500 dark:text-teal-400 font-mono">
              {totalCurrentPowerDemandKW.toFixed(3)} kW
            </strong>
          </span>
        </div>
      </div>

      {/* APPLIANCE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAppliances.map(app => {
          const currentPowerW =
            app.status === 'ON'
              ? app.operatingPowerW * app.quantity
              : app.status === 'STANDBY'
              ? (app.standbyPowerW || 0) * app.quantity
              : 0;

          const dailyEnergyKWh =
            (app.operatingPowerW * app.quantity * app.dailyUsageHours) / 1000;
          const monthlyEstCost = calculateApplianceMonthlyCost(
            app.operatingPowerW,
            app.dailyUsageHours,
            app.quantity,
            effectiveRate
          );

          return (
            <div
              key={app.id}
              className={`bg-[#FFFFFF] dark:bg-[#111C2E] border rounded-xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between ${
                app.status === 'ON'
                  ? 'border-teal-500/40 ring-1 ring-teal-500/20'
                  : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Top: Icon, Name, Category */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {renderApplianceIcon(app.iconName, app.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                        {app.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          {app.room}
                        </span>
                        {app.quantity > 1 && (
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Qty: {app.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle Switch */}
                  <button
                    onClick={() => toggleApplianceStatus(app.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      app.status === 'ON' ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    title={`Click to simulate ${app.status === 'ON' ? 'turning OFF' : 'turning ON'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        app.status === 'ON' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Status Badges */}
                <div className="mt-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        app.status === 'ON'
                          ? 'success'
                          : app.status === 'STANDBY'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                      pulse={app.status === 'ON'}
                    >
                      {app.status}
                    </Badge>
                    <span className="text-[11px] text-slate-400">{app.category}</span>
                  </div>

                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {currentPowerW} W{' '}
                    <span className="text-[10px] font-normal text-slate-400">active</span>
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-100 dark:border-slate-800/80 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Rated
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {app.ratedPowerW * app.quantity} W
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Daily Est.
                    </span>
                    <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">
                      {dailyEnergyKWh.toFixed(2)} kWh
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Monthly Cost
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      ₹{Math.round(monthlyEstCost)}
                    </span>
                  </div>
                </div>

                {/* Additional Specific Controls: Fan Speed / AC Temp */}
                {app.category === 'Cooling' && app.acTemp !== undefined && (
                  <div className="mt-3 flex items-center justify-between text-xs px-2 py-1 rounded bg-teal-500/5 border border-teal-500/10">
                    <span className="text-slate-400">AC Setpoint:</span>
                    <span className="font-mono font-semibold text-teal-400">{app.acTemp}°C</span>
                  </div>
                )}
                {app.category === 'Cooling' && app.fanSpeed !== undefined && (
                  <div className="mt-3 flex items-center justify-between text-xs px-2 py-1 rounded bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-slate-400">Fan Speed:</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      Level {app.fanSpeed} / 5
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {app.dailyUsageHours}h/day
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingAppliance(app)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit appliance parameters"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(app.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition"
                    title="Delete appliance"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT APPLIANCE MODAL */}
      {editingAppliance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Edit Appliance: {editingAppliance.name}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">
                  Appliance Name
                </label>
                <input
                  type="text"
                  value={editingAppliance.name}
                  onChange={e =>
                    setEditingAppliance({ ...editingAppliance, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">
                    Rated Power (Watts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingAppliance.ratedPowerW}
                    onChange={e =>
                      setEditingAppliance({
                        ...editingAppliance,
                        ratedPowerW: Number(e.target.value),
                        operatingPowerW: Math.min(
                          editingAppliance.operatingPowerW,
                          Number(e.target.value)
                        ),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editingAppliance.quantity}
                    onChange={e =>
                      setEditingAppliance({
                        ...editingAppliance,
                        quantity: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Room</label>
                  <select
                    value={editingAppliance.room}
                    onChange={e =>
                      setEditingAppliance({
                        ...editingAppliance,
                        room: e.target.value as RoomType,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    {ROOMS.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Category</label>
                  <select
                    value={editingAppliance.category}
                    onChange={e =>
                      setEditingAppliance({
                        ...editingAppliance,
                        category: e.target.value as ApplianceCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">
                    Daily Usage (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={editingAppliance.dailyUsageHours}
                    onChange={e =>
                      setEditingAppliance({
                        ...editingAppliance,
                        dailyUsageHours: Math.min(24, Math.max(0, Number(e.target.value))),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">
                    Standby Power (W)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingAppliance.standbyPowerW}
                    onChange={e =>
                      setEditingAppliance({
                        ...editingAppliance,
                        standbyPowerW: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingAppliance(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateAppliance(editingAppliance.id, editingAppliance);
                  setEditingAppliance(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-slate-950 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD APPLIANCE MODAL */}
      {isAddModalOpen && (
        <AddApplianceModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={app => {
            addAppliance(app);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Remove Appliance?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to remove this appliance from the simulated household inventory?
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAppliance(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal component to add a custom appliance
const AddApplianceModal: React.FC<{
  onClose: () => void;
  onAdd: (app: Omit<Appliance, 'id'>) => void;
}> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ApplianceCategory>('Other');
  const [room, setRoom] = useState<RoomType>('Living Room');
  const [ratedPowerW, setRatedPowerW] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [dailyUsageHours, setDailyUsageHours] = useState(4);
  const [standbyPowerW, setStandbyPowerW] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      category,
      room,
      ratedPowerW,
      operatingPowerW: Math.round(ratedPowerW * 0.9),
      standbyPowerW,
      quantity,
      status: 'OFF',
      dailyUsageHours,
      isEnabled: true,
      scheduleStart: '09:00',
      scheduleEnd: '17:00',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
      >
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Add Custom Simulated Appliance
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">Appliance Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Electric Vehicle Charger, Air Purifier"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Rated Power (W)</label>
              <input
                type="number"
                min="1"
                required
                value={ratedPowerW}
                onChange={e => setRatedPowerW(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Room</label>
              <select
                value={room}
                onChange={e => setRoom(e.target.value as RoomType)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              >
                {ROOMS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ApplianceCategory)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Daily Usage (Hours)</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={dailyUsageHours}
                onChange={e => setDailyUsageHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1">Standby Power (W)</label>
              <input
                type="number"
                min="0"
                value={standbyPowerW}
                onChange={e => setStandbyPowerW(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-slate-950 transition"
          >
            Add Appliance
          </button>
        </div>
      </form>
    </div>
  );
};
