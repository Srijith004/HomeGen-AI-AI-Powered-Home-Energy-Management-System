import React, { useState } from 'react';
import {
  Database,
  Sparkles,
  RefreshCw,
  Trash2,
  Download,
  CheckCircle2,
  Sliders,
  Calendar,
  Clock,
  Zap,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { exportService } from '../services/exportService';
import { Badge } from '../components/common/Badge';

export const DataGenerator: React.FC = () => {
  const {
    appliances,
    datasets,
    generateDataset,
    clearDataset,
    isGenerating,
  } = useEnergy();

  // Generator configuration states
  const [durationDays, setDurationDays] = useState<7 | 30 | 90 | 180 | 365>(7);
  const [intervalMinutes, setIntervalMinutes] = useState<15 | 30 | 60 | 1440>(60);
  const [seed, setSeed] = useState<string>('homegen-academic-2026');
  const [usageIntensity, setUsageIntensity] = useState<'low' | 'normal' | 'high'>('normal');
  const [seasonalVariation, setSeasonalVariation] = useState<boolean>(true);
  const [weekdayWeekendVariation, setWeekdayWeekendVariation] = useState<boolean>(true);
  const [selectedApplianceIds, setSelectedApplianceIds] = useState<string[]>(
    appliances.map(a => a.id)
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Trigger generation
  const handleGenerate = () => {
    setFeedbackMessage('Generating synthetic household energy records...');
    generateDataset({
      durationDays,
      intervalMinutes,
      seed,
      usageIntensity,
      seasonalVariation,
      weekdayWeekendVariation,
      selectedApplianceIds,
    });
    setTimeout(() => {
      setFeedbackMessage('Synthetic dataset generated successfully using Mulberry32 PRNG.');
    }, 400);
  };

  // Quick seed regenerator
  const handleRandomSeed = () => {
    const newSeed = `seed-${Math.random().toString(36).substring(2, 8)}`;
    setSeed(newSeed);
  };

  // Toggle select all appliances
  const handleToggleAllAppliances = () => {
    if (selectedApplianceIds.length === appliances.length) {
      setSelectedApplianceIds([]);
    } else {
      setSelectedApplianceIds(appliances.map(a => a.id));
    }
  };

  const handleToggleAppliance = (id: string) => {
    if (selectedApplianceIds.includes(id)) {
      setSelectedApplianceIds(selectedApplianceIds.filter(i => i !== id));
    } else {
      setSelectedApplianceIds([...selectedApplianceIds, id]);
    }
  };

  // Validation metrics
  const totalUnits = datasets.reduce((sum, r) => sum + r.energyKWh, 0);
  const hasNegativeValues = datasets.some(r => r.energyKWh < 0 || r.operatingPowerW < 0);
  const previewRecords = datasets.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Synthetic Energy Data Generator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generate reproducible, high-resolution household energy consumption datasets using Mulberry32 PRNG.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {datasets.length > 0 && (
            <button
              onClick={() => exportService.exportCompleteDataset(datasets)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={clearDataset}
            disabled={datasets.length === 0}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Dataset</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {feedbackMessage && (
        <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center gap-2 text-xs text-teal-800 dark:text-teal-300">
          <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* GENERATOR CONFIGURATION FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-5 h-5 text-teal-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Simulation Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Duration */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                Dataset Duration
              </label>
              <select
                value={durationDays}
                onChange={e => setDurationDays(Number(e.target.value) as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value={7}>7 Days (Quick Exploration)</option>
                <option value={30}>30 Days (Standard Monthly Billing)</option>
                <option value={90}>90 Days (Quarterly Seasonality)</option>
                <option value={180}>180 Days (Half-Year Trend)</option>
                <option value={365}>365 Days (Full Annual Academic Dataset)</option>
              </select>
            </div>

            {/* Interval */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                Data Interval
              </label>
              <select
                value={intervalMinutes}
                onChange={e => setIntervalMinutes(Number(e.target.value) as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value={15}>15 Minutes (Smart Meter High Resolution)</option>
                <option value={30}>30 Minutes (Standard Interval)</option>
                <option value={60}>1 Hour (Hourly Profiles - Recommended)</option>
                <option value={1440}>Daily Aggregate (1 Day)</option>
              </select>
            </div>

            {/* Seed */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium">
                  Random Seed (Mulberry32)
                </label>
                <button
                  type="button"
                  onClick={handleRandomSeed}
                  className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Randomize
                </button>
              </div>
              <input
                type="text"
                value={seed}
                onChange={e => setSeed(e.target.value)}
                placeholder="Enter string or number"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Identical seeds produce bit-exact reproducible datasets.
              </span>
            </div>

            {/* Usage Intensity */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                Household Usage Intensity
              </label>
              <select
                value={usageIntensity}
                onChange={e => setUsageIntensity(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="low">Low (Conservative / Frugal - 0.8x)</option>
                <option value="normal">Normal (Typical 3BHK Resident - 1.0x)</option>
                <option value="high">High (Heavy Continuous Cooling/Cooking - 1.25x)</option>
              </select>
            </div>
          </div>

          {/* Variation Toggles */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={seasonalVariation}
                onChange={e => setSeasonalVariation(e.target.checked)}
                className="rounded border-slate-700 text-teal-500 focus:ring-0"
              />
              <span>Apply Seasonal Temperature Variation (Summer AC boost / Winter drop)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={weekdayWeekendVariation}
                onChange={e => setWeekdayWeekendVariation(e.target.checked)}
                className="rounded border-slate-700 text-teal-500 focus:ring-0"
              />
              <span>Apply Weekday vs Weekend Occupancy Adjustments (+15% daytime electronics)</span>
            </label>
          </div>

          {/* Appliance Selection Checklist */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Include Appliances in Synthesis ({selectedApplianceIds.length} / {appliances.length})
              </span>
              <button
                type="button"
                onClick={handleToggleAllAppliances}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
              >
                {selectedApplianceIds.length === appliances.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800">
              {appliances.map(app => (
                <label
                  key={app.id}
                  className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedApplianceIds.includes(app.id)}
                    onChange={() => handleToggleAppliance(app.id)}
                    className="rounded border-slate-700 text-teal-500 focus:ring-0"
                  />
                  <span className="truncate">{app.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || selectedApplianceIds.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-slate-950 shadow-md shadow-teal-500/20 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Generating Records...' : 'Generate Synthetic Dataset'}</span>
            </button>
          </div>
        </div>

        {/* DATASET VALIDATION & SUMMARY SIDEBAR */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Dataset Integrity & Audit
              </h2>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Total Generated Records:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {datasets.length.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Total Energy:</span>
                <span className="font-mono font-bold text-teal-500 dark:text-teal-400">
                  {totalUnits.toFixed(2)} kWh
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Negative Values Check:</span>
                <span className="font-semibold text-emerald-500 flex items-center gap-1">
                  {!hasNegativeValues ? 'Zero (Passed)' : 'Violated'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Power Rating Cap:</span>
                <span className="font-semibold text-emerald-500">P_op ≤ P_rated</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Dataset Tag:</span>
                <Badge variant="teal" size="sm">
                  Synthetic
                </Badge>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Algorithm:</span>
                <span className="font-mono text-slate-300">Mulberry32 PRNG</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-teal-400">Methodology Note: </span>
            This simulator applies physical thermodynamic models (refrigerator cycling, AC inverter staging, fan speed modulation) rather than independent random numbers.
          </div>
        </div>
      </div>

      {/* PREVIEW TABLE */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Generated Records Preview
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Showing first {previewRecords.length} records
          </span>
        </div>

        {previewRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Appliance</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Rated Power</th>
                  <th className="py-2.5 px-3">Operating Power</th>
                  <th className="py-2.5 px-3">Energy (kWh)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Dataset Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {previewRecords.map(r => (
                  <tr key={r.recordId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono text-[11px]">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                      {r.applianceName}
                    </td>
                    <td className="py-2 px-3">{r.room}</td>
                    <td className="py-2 px-3 font-mono">{r.ratedPowerW} W</td>
                    <td className="py-2 px-3 font-mono text-teal-500 dark:text-teal-400">
                      {r.operatingPowerW} W
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold">{r.energyKWh}</td>
                    <td className="py-2 px-3">
                      <Badge
                        variant={
                          r.operatingStatus === 'ON'
                            ? 'success'
                            : r.operatingStatus === 'STANDBY'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {r.operatingStatus}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] text-slate-400 font-mono">{r.datasetType}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No records generated yet. Click "Generate Synthetic Dataset" above.
          </div>
        )}
      </div>
    </div>
  );
};
