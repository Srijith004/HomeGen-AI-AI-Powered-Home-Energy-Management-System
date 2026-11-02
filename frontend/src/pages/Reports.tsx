import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  FileText,
  Zap,
  Receipt,
  TrendingUp,
  Cpu,
  Layers,
  Leaf,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { exportService } from '../services/exportService';
import { predictionService } from '../services/predictionService';
import { Badge } from '../components/common/Badge';

export const Reports: React.FC = () => {
  const {
    household,
    appliances,
    datasets,
    currentBill,
    tariffSettings,
    scenarioComparison,
  } = useEnergy();

  const [activeReportTab, setActiveReportTab] = useState<
    'monthly' | 'appliance' | 'billing' | 'scenario' | 'prediction'
  >('monthly');

  // Prediction for report
  const forecast = predictionService.generateForecast(datasets, 30, tariffSettings);

  const handlePrint = () => {
    window.print();
  };

  const totalKWh = datasets.reduce((s, r) => s + r.energyKWh, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports & CSV Export
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generate and export comprehensive household energy audit statements, CSV telemetry, and billing records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* CSV EXPORT HUBS (6 CSV FORMATS) */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <FileSpreadsheet className="w-5 h-5 text-teal-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Downloadable CSV Datasets (UTF-8 Encoded)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* 1. Complete Dataset */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">1. Complete Raw Telemetry</span>
                <Badge variant="teal" size="sm">
                  Full
                </Badge>
              </div>
              <p className="text-slate-400 mt-1">
                All simulated records with timestamps, operating power, status, duration, and energy.
              </p>
            </div>
            <button
              onClick={() => exportService.exportCompleteDataset(datasets)}
              disabled={datasets.length === 0}
              className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Raw Dataset ({datasets.length})</span>
            </button>
          </div>

          {/* 2. Appliance-wise Summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">2. Appliance Consumption</span>
                <Badge variant="neutral" size="sm">
                  Appliance
                </Badge>
              </div>
              <p className="text-slate-400 mt-1">
                Aggregated energy, estimated monthly costs, rated power, and runtime hours per appliance.
              </p>
            </div>
            <button
              onClick={() => exportService.exportApplianceSummary(appliances, datasets)}
              className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Appliance CSV</span>
            </button>
          </div>

          {/* 3. Daily Summary */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">3. Daily Consumption</span>
                <Badge variant="neutral" size="sm">
                  Daily
                </Badge>
              </div>
              <p className="text-slate-400 mt-1">
                Date-wise aggregated household consumption (kWh), peak load wattage, and daily cost.
              </p>
            </div>
            <button
              onClick={() => exportService.exportDailySummary(datasets)}
              className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Daily CSV</span>
            </button>
          </div>

          {/* 4. Electricity Bill Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">4. Electricity Bill Statement</span>
                <Badge variant="neutral" size="sm">
                  Billing
                </Badge>
              </div>
              <p className="text-slate-400 mt-1">
                Slab-by-slab unit consumption, fixed charges, duties, and progressive tariff schedule.
              </p>
            </div>
            <button
              onClick={() => exportService.exportBillBreakdown(currentBill)}
              className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Bill CSV</span>
            </button>
          </div>

          {/* 5. Energy Prediction Results */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">5. Energy Prediction Forecast</span>
                <Badge variant="neutral" size="sm">
                  Forecast
                </Badge>
              </div>
              <p className="text-slate-400 mt-1">
                Forward projection with rolling average, uncertainty boundaries, and trend analysis.
              </p>
            </div>
            <button
              onClick={() => exportService.exportPredictionResults(forecast)}
              className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Prediction CSV</span>
            </button>
          </div>

          {/* 6. Scenario Comparison */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">6. Scenario Simulation Delta</span>
                <Badge variant="neutral" size="sm">
                  Scenarios
                </Badge>
              </div>
              <p className="text-slate-400 mt-1">
                Mathematical delta comparing Normal, Energy Saving, Peak, and Vacation profiles.
              </p>
            </div>
            <button
              onClick={() => exportService.exportScenarioComparison([scenarioComparison])}
              className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Scenario CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* FORMAL AUDIT REPORT PREVIEW (PRINTABLE) */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-8 shadow-xs space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* Report Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-teal-400 fill-current" />
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                HomeGen AI — Residential Energy Audit Statement
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Document ID: HEMS-REP-{Date.now().toString().slice(-6)} • Academic Simulation Demonstration
            </p>
          </div>

          <div className="text-xs sm:text-right font-mono text-slate-400">
            <div>Generated: {new Date().toLocaleDateString('en-IN')}</div>
            <div>Time Zone: Asia/Kolkata</div>
            <Badge variant="teal" size="sm">
              Verified Synthetic Simulation
            </Badge>
          </div>
        </div>

        {/* Household Profile Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220]/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Household Name</span>
            <span className="font-semibold text-slate-900 dark:text-white">{household.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Layout Structure</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              3BHK ({household.bedrooms} Bed, {household.bathrooms} Bath)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Active Tariff Mode</span>
            <span className="font-semibold text-slate-900 dark:text-white uppercase font-mono">
              {tariffSettings.mode} Billing
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Inventory Size</span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono">
              {appliances.length} Appliances Configured
            </span>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Executive Summary & Findings
          </h3>
          <p>
            During the observed simulation duration, the 3BHK residential household logged a total consumption of{' '}
            <strong className="text-teal-400 font-mono">{totalKWh.toFixed(1)} kWh</strong>, corresponding to an estimated energy charge of{' '}
            <strong className="text-slate-900 dark:text-white font-mono">₹{currentBill.energyChargeINR.toFixed(2)}</strong> and net payable bill of{' '}
            <strong className="text-emerald-400 font-mono">₹{currentBill.totalBillINR.toFixed(2)}</strong> (including demand fees and regulatory surcharges).
          </p>
          <p>
            Cooling equipment and thermodynamic water heating represent over 50% of cumulative energy consumption. Under the progressive slab tariff, consumption exceeding 300 units enters the highest demonstration tier (₹6.00/unit), presenting immediate financial incentives for setback temperature controls and off-peak load shifting.
          </p>
        </div>

        {/* Key Observations Table */}
        <div className="space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Audit Metric Summary
          </h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex justify-between p-3">
              <span className="text-slate-400">Total Billed Consumption</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {currentBill.totalUnitsKWh} kWh
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-400">Average Daily Consumption</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {currentBill.avgDailyUnitsKWh} kWh/day
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-400">Average Daily Cost</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                ₹{currentBill.avgDailyCostINR}/day
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-400">Monthly Projected Expenditure</span>
              <span className="font-mono font-semibold text-emerald-500">
                ₹{Math.round(currentBill.projectedMonthlyCostINR).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-slate-400">Potential Energy Savings (Energy Saving Mode)</span>
              <span className="font-mono font-semibold text-teal-400">
                {scenarioComparison.dailyEnergySavedKWh} kWh/day ({scenarioComparison.savingsPercentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Sign-off / Disclaimer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 space-y-1">
          <p>
            * HomeGen AI is an educational simulation framework developed for academic demonstrations. All telemetry records and controls are software simulations and do not reflect physical electric utility meters.
          </p>
        </div>
      </div>
    </div>
  );
};
