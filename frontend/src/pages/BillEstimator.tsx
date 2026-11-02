import React, { useState } from 'react';
import {
  Receipt,
  Calculator,
  Sliders,
  Plus,
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  Check,
  TrendingDown,
  Info,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { exportService } from '../services/exportService';
import { TariffSlab } from '../types';
import { Badge } from '../components/common/Badge';
import { calculateApplianceMonthlyCost } from '../utils/calculations';

export const BillEstimator: React.FC = () => {
  const { tariffSettings, updateTariffSettings, currentBill, appliances } = useEnergy();

  // Individual appliance calculator state
  const [selectedAppId, setSelectedAppId] = useState<string>(appliances[0]?.id || '');
  const [calcWatts, setCalcWatts] = useState<number>(1500);
  const [calcHours, setCalcHours] = useState<number>(6);
  const [calcQuantity, setCalcQuantity] = useState<number>(1);

  // Slabs editing local state
  const isSlabMode = tariffSettings.mode === 'slab';

  const handleSelectApplianceForCalc = (appId: string) => {
    setSelectedAppId(appId);
    const app = appliances.find(a => a.id === appId);
    if (app) {
      setCalcWatts(app.operatingPowerW);
      setCalcHours(app.dailyUsageHours);
      setCalcQuantity(app.quantity);
    }
  };

  const handleAddSlab = () => {
    const lastSlab = tariffSettings.slabs[tariffSettings.slabs.length - 1];
    const newFrom = lastSlab ? (lastSlab.toUnits || 300) : 0;
    const newSlab: TariffSlab = {
      id: `slab-${Date.now()}`,
      fromUnits: newFrom,
      toUnits: newFrom + 100,
      rate: (lastSlab?.rate || 4.0) + 1.5,
      label: `Units ${newFrom + 1} - ${newFrom + 100}`,
    };
    updateTariffSettings({
      slabs: [...tariffSettings.slabs, newSlab],
    });
  };

  const handleRemoveSlab = (id: string) => {
    if (tariffSettings.slabs.length <= 1) return;
    updateTariffSettings({
      slabs: tariffSettings.slabs.filter(s => s.id !== id),
    });
  };

  const handleUpdateSlab = (id: string, updates: Partial<TariffSlab>) => {
    updateTariffSettings({
      slabs: tariffSettings.slabs.map(s => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  // Appliance calculation output
  const effectiveRate = isSlabMode ? 4.5 : tariffSettings.flatRate;
  const calculatedApplianceCost = calculateApplianceMonthlyCost(
    calcWatts,
    calcHours,
    calcQuantity,
    effectiveRate
  );
  const calculatedApplianceKWh = ((calcWatts * calcQuantity * calcHours * 30) / 1000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Electricity Bill Estimator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Progressive slab-based tariff engine and flat rate estimator with itemized appliance cost modeling.
          </p>
        </div>

        <button
          onClick={() => exportService.exportBillBreakdown(currentBill)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Bill Statement</span>
        </button>
      </div>

      {/* TARIFF DISCLAIMER BANNER */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Demonstration Tariff Notice: </span>
          The slab limits and rates configured here are academic demonstration parameters. They do not constitute the official Tamil Nadu Generation and Distribution Corporation (TANGEDCO) tariff schedule. You can adjust all slab limits and rates dynamically below.
        </div>
      </div>

      {/* BILL SUMMARY DISPLAY & BILLING MODE TOGGLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bill Summary Statement */}
        <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-teal-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Monthly Electricity Bill Statement
              </h2>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-[#0B1220]">
              <button
                onClick={() => updateTariffSettings({ mode: 'slab' })}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  isSlabMode
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-white'
                }`}
              >
                Progressive Slab
              </button>
              <button
                onClick={() => updateTariffSettings({ mode: 'flat' })}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  !isSlabMode
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-white'
                }`}
              >
                Flat Tariff
              </button>
            </div>
          </div>

          {/* Statement Big Number */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-500/20">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                Total Estimated Bill
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  ₹{Math.round(currentBill.totalBillINR).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  for {currentBill.totalUnitsKWh} units (kWh)
                </span>
              </div>
            </div>

            <div className="mt-3 sm:mt-0 flex gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Avg Daily Cost</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ₹{currentBill.avgDailyCostINR.toFixed(2)}/day
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Projected Monthly</span>
                <span className="font-semibold text-teal-600 dark:text-teal-400">
                  ₹{Math.round(currentBill.projectedMonthlyCostINR).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Calculation Breakdown Table */}
          <div className="space-y-3 text-xs">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Itemized Cost Breakdown
            </h3>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-[#0B1220]/40">
                <span className="text-slate-600 dark:text-slate-400">Energy Consumption Charge</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  ₹{currentBill.energyChargeINR.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between p-3">
                <span className="text-slate-600 dark:text-slate-400">Fixed Monthly Demand Charge</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  ₹{currentBill.fixedChargeINR.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between p-3">
                <span className="text-slate-600 dark:text-slate-400">Meter / Regulatory Charge</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  ₹{currentBill.additionalChargesINR.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between p-3">
                <span className="text-slate-600 dark:text-slate-400">
                  Electricity Duty / Surcharge ({tariffSettings.surchargeTaxPercent}%)
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  ₹{currentBill.surchargeINR.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between p-3 bg-teal-500/10 font-bold text-slate-900 dark:text-white text-sm">
                <span>Net Payable Amount</span>
                <span className="font-mono text-teal-500 dark:text-teal-400">
                  ₹{currentBill.totalBillINR.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Progressive Slab Consumption Breakdown (if in slab mode) */}
          {isSlabMode && currentBill.slabBreakdown && (
            <div className="space-y-3 pt-2">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Progressive Tier Allocation
              </h3>

              <div className="space-y-2 text-xs">
                {currentBill.slabBreakdown.map((slab, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {slab.slabLabel}
                      </span>
                      <span className="text-slate-400 ml-2 font-mono text-[11px]">
                        (@ ₹{slab.rate.toFixed(2)}/unit)
                      </span>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        {slab.unitsBilled.toFixed(1)} units billed
                      </span>
                      <span className="font-bold text-teal-500 dark:text-teal-400 w-20 text-right">
                        ₹{slab.amountINR.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TARIFF SETTINGS CONFIGURATOR */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-5 h-5 text-teal-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Tariff Configuration
              </h2>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Flat Rate setting */}
              {!isSlabMode ? (
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Flat Rate (₹/kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={tariffSettings.flatRate}
                    onChange={e =>
                      updateTariffSettings({ flatRate: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              ) : (
                /* Editable Slabs */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">Editable Consumption Slabs</span>
                    <button
                      type="button"
                      onClick={handleAddSlab}
                      className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Slab
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {tariffSettings.slabs.map((slab, index) => (
                      <div
                        key={slab.id}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-700/60 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={slab.label}
                            onChange={e => handleUpdateSlab(slab.id, { label: e.target.value })}
                            className="text-[11px] font-semibold bg-transparent border-none text-slate-800 dark:text-slate-200 focus:outline-none"
                          />
                          {tariffSettings.slabs.length > 1 && (
                            <button
                              onClick={() => handleRemoveSlab(slab.id)}
                              className="text-red-400 hover:text-red-500 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Up To Units</span>
                            <input
                              type="number"
                              placeholder="Infinity"
                              value={slab.toUnits === null ? '' : slab.toUnits}
                              onChange={e =>
                                handleUpdateSlab(slab.id, {
                                  toUnits: e.target.value === '' ? null : Number(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1 rounded bg-white dark:bg-[#111C2E] border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Rate (₹/unit)</span>
                            <input
                              type="number"
                              step="0.25"
                              value={slab.rate}
                              onChange={e =>
                                handleUpdateSlab(slab.id, {
                                  rate: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                              className="w-full px-2 py-1 rounded bg-white dark:bg-[#111C2E] border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fixed & Additional Charges */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">Fixed Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={tariffSettings.fixedCharge}
                    onChange={e =>
                      updateTariffSettings({ fixedCharge: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Additional (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={tariffSettings.additionalCharge}
                    onChange={e =>
                      updateTariffSettings({
                        additionalCharge: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tax / Surcharge (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={tariffSettings.surchargeTaxPercent}
                  onChange={e =>
                    updateTariffSettings({
                      surchargeTaxPercent: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL APPLIANCE COST CALCULATOR */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Calculator className="w-5 h-5 text-teal-500" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Individual Appliance Marginal Cost Calculator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formula: Monthly Appliance Cost = (Power in W × Daily Usage Hours × 30 / 1000) × Tariff Rate
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Load Appliance Preset</label>
            <select
              value={selectedAppId}
              onChange={e => handleSelectApplianceForCalc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
            >
              {appliances.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.ratedPowerW}W)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Operating Power (Watts)</label>
            <input
              type="number"
              min="1"
              value={calcWatts}
              onChange={e => setCalcWatts(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Daily Run Time (Hours)</label>
            <input
              type="number"
              step="0.5"
              min="0.1"
              max="24"
              value={calcHours}
              onChange={e => setCalcHours(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={calcQuantity}
              onChange={e => setCalcQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Calculation Result Callout */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400">Allocated Monthly Consumption: </span>
            <strong className="text-slate-900 dark:text-white font-mono">
              {calculatedApplianceKWh.toFixed(1)} kWh/month
            </strong>
            <span className="text-slate-500 text-[11px] block sm:inline sm:ml-2">
              (Effective tariff assumed: ₹{effectiveRate.toFixed(2)}/unit)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Estimated Monthly Cost:</span>
            <span className="text-xl font-extrabold text-teal-500 dark:text-teal-400 font-mono">
              ₹{Math.round(calculatedApplianceCost).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
