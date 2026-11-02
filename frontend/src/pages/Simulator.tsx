import React, { useState } from 'react';
import {
  Home,
  Sliders,
  Zap,
  Leaf,
  Flame,
  Plane,
  RotateCcw,
  Clock,
  AirVent,
  Fan,
  Power,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Percent,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { ROOMS } from '../constants/defaultData';
import { RoomType } from '../types';
import { Badge } from '../components/common/Badge';

export const Simulator: React.FC = () => {
  const {
    appliances,
    activeScenarioId,
    applyScenario,
    toggleApplianceStatus,
    setFanSpeed,
    setAcTemp,
    totalCurrentPowerDemandKW,
    scenarioComparison,
  } = useEnergy();

  const [selectedRoom, setSelectedRoom] = useState<RoomType>('Bedroom 1');

  // Filter appliances for current room
  const roomAppliances = appliances.filter(a => a.room === selectedRoom);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Smart Home Simulator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Interactive room-by-room control with HVAC setpoints, fan regulation, and one-click scenario testing.
          </p>
        </div>

        {/* Live Power Demand Pill */}
        <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs">
          <Zap className="w-4 h-4 text-teal-400" />
          <span className="text-slate-400">Simulated Demand:</span>
          <span className="font-mono font-bold text-teal-400">
            {totalCurrentPowerDemandKW.toFixed(3)} kW
          </span>
        </div>
      </div>

      {/* 4 PREDEFINED SCENARIOS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scenario 1: Normal */}
        <div
          onClick={() => applyScenario('normal')}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${
            activeScenarioId === 'normal'
              ? 'bg-teal-500/10 border-teal-500 ring-2 ring-teal-500/30'
              : 'bg-[#FFFFFF] dark:bg-[#111C2E] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-teal-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            {activeScenarioId === 'normal' && (
              <Badge variant="teal" size="sm">
                Active
              </Badge>
            )}
          </div>
          <h3 className="mt-3 font-semibold text-sm text-slate-900 dark:text-white">
            Normal Household Mode
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Standard diurnal routine with master bedroom AC, lights, and kitchen loads.
          </p>
        </div>

        {/* Scenario 2: Energy Saving */}
        <div
          onClick={() => applyScenario('energy_saving')}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${
            activeScenarioId === 'energy_saving'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-[#FFFFFF] dark:bg-[#111C2E] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Leaf className="w-5 h-5" />
            </div>
            {activeScenarioId === 'energy_saving' && (
              <Badge variant="success" size="sm">
                Active
              </Badge>
            )}
          </div>
          <h3 className="mt-3 font-semibold text-sm text-slate-900 dark:text-white">
            Energy Saving Mode
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            AC setpoint 25°C, unnecessary lights off, standby loads isolated. ~24% savings.
          </p>
        </div>

        {/* Scenario 3: Peak Usage */}
        <div
          onClick={() => applyScenario('peak')}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${
            activeScenarioId === 'peak'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-[#FFFFFF] dark:bg-[#111C2E] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            {activeScenarioId === 'peak' && (
              <Badge variant="warning" size="sm">
                Active
              </Badge>
            )}
          </div>
          <h3 className="mt-3 font-semibold text-sm text-slate-900 dark:text-white">
            Peak Usage Mode
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Simultaneous ACs at 20°C, multiple TVs, full lighting, and heavy kitchen appliances.
          </p>
        </div>

        {/* Scenario 4: Vacation */}
        <div
          onClick={() => applyScenario('vacation')}
          className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${
            activeScenarioId === 'vacation'
              ? 'bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/30'
              : 'bg-[#FFFFFF] dark:bg-[#111C2E] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Plane className="w-5 h-5" />
            </div>
            {activeScenarioId === 'vacation' && (
              <Badge variant="info" size="sm">
                Active
              </Badge>
            )}
          </div>
          <h3 className="mt-3 font-semibold text-sm text-slate-900 dark:text-white">
            Vacation Mode
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Non-essentials switched off. Refrigerator and security Wi-Fi minimal drain. ~78% drop.
          </p>
        </div>
      </div>

      {/* SCENARIO COMPARISON PANEL */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          Scenario Comparison & Savings Impact
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Direct mathematical evaluation comparing Baseline (Normal) against {scenarioComparison.scenarioName}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Baseline Daily Energy</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {scenarioComparison.baselineDailyKWh} kWh/day
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              ₹{scenarioComparison.baselineDailyCostINR}/day baseline
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Scenario Daily Energy</span>
            <span className="text-xl font-bold text-teal-400 font-mono">
              {scenarioComparison.scenarioDailyKWh} kWh/day
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              ₹{scenarioComparison.scenarioDailyCostINR}/day estimated
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-400 block mb-1 font-semibold">Net Daily Energy Saved</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">
              {scenarioComparison.dailyEnergySavedKWh} kWh/day
            </span>
            <span className="text-[11px] text-emerald-300 block mt-1">
              {scenarioComparison.savingsPercentage}% savings vs baseline
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <span className="text-teal-400 block mb-1 font-semibold">Monthly Projected Cost Saved</span>
            <span className="text-xl font-bold text-teal-400 font-mono">
              ₹{Math.round(scenarioComparison.monthlyCostSavedINR).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-teal-300 block mt-1">
              {scenarioComparison.monthlyEnergySavedKWh} kWh/month saved
            </span>
          </div>
        </div>
      </div>

      {/* ROOM-BY-ROOM SMART HOME CONTROLLER */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-teal-500" />
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                3BHK Interactive Floorplan Controller
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select a zone to inspect and adjust room-specific simulated appliances
              </p>
            </div>
          </div>
        </div>

        {/* Room Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800/60">
          {ROOMS.map(room => (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedRoom === room
                  ? 'bg-teal-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {room}
            </button>
          ))}
        </div>

        {/* Appliances in Selected Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roomAppliances.length > 0 ? (
            roomAppliances.map(app => (
              <div
                key={app.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {app.name}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {app.category} • Rated {app.ratedPowerW * app.quantity}W
                    </span>
                  </div>

                  <button
                    onClick={() => toggleApplianceStatus(app.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      app.status === 'ON' ? 'bg-teal-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        app.status === 'ON' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Specific controls: Air Conditioner Temp Slider */}
                {app.category === 'Cooling' && app.acTemp !== undefined && (
                  <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-300 flex items-center gap-1.5">
                        <AirVent className="w-3.5 h-3.5 text-teal-400" />
                        AC Temperature Setpoint
                      </span>
                      <span className="font-mono font-bold text-teal-400 text-sm">
                        {app.acTemp}°C
                      </span>
                    </div>

                    <input
                      type="range"
                      min="16"
                      max="30"
                      value={app.acTemp}
                      onChange={e => setAcTemp(app.id, Number(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer"
                    />

                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>16°C (High Load)</span>
                      <span className="text-teal-400 font-semibold">24°C (Optimal)</span>
                      <span>30°C (Eco)</span>
                    </div>
                  </div>
                )}

                {/* Specific controls: Ceiling Fan Speed */}
                {app.category === 'Cooling' && app.fanSpeed !== undefined && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-300 flex items-center gap-1.5">
                        <Fan className="w-3.5 h-3.5 text-emerald-400" />
                        Ceiling Fan Speed
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        Speed {app.fanSpeed} / 5
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map(spd => (
                        <button
                          key={spd}
                          onClick={() => setFanSpeed(app.id, spd)}
                          className={`py-1 rounded font-semibold text-xs font-mono transition ${
                            app.fanSpeed === spd
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {spd}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Power draw indicators */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                  <span className="text-slate-400">Current Draw:</span>
                  <span className="font-bold text-teal-400">
                    {app.status === 'ON' ? `${app.operatingPowerW * app.quantity} W` : '0 W (Off)'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-8 text-center text-xs text-slate-400">
              No appliances currently assigned to {selectedRoom}. Add appliances in Appliance Management.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
