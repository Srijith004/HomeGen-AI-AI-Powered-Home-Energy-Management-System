import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEnergy } from '../context/EnergyContext';
import { predictionService } from '../services/predictionService';
import { exportService } from '../services/exportService';
import { Badge } from '../components/common/Badge';

export const Predictions: React.FC = () => {
  const { datasets, tariffSettings, theme } = useEnergy();

  const [periodDays, setPeriodDays] = useState<7 | 15 | 30>(7);
  const [customTrend, setCustomTrend] = useState<number>(1.0); // 1.0 = standard historical trend

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#64748B' : '#94A3B8';
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';

  // Generate forecast
  const forecast = useMemo(() => {
    return predictionService.generateForecast(datasets, periodDays, tariffSettings, customTrend);
  }, [datasets, periodDays, tariffSettings, customTrend]);

  // Combined chart data: Recent 7 days of historical + future forecast days
  const chartData = useMemo(() => {
    const combined: any[] = [];

    // Group historical by date
    const historyMap = new Map<string, number>();
    for (const r of datasets) {
      const d = r.timestamp.split('T')[0];
      historyMap.set(d, (historyMap.get(d) || 0) + r.energyKWh);
    }

    const sortedHistory = Array.from(historyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7);

    // Add historical records
    for (const [dateStr, val] of sortedHistory) {
      const d = new Date(dateStr);
      combined.push({
        label: `${d.getMonth() + 1}/${d.getDate()} (Hist)`,
        historicalKWh: Number(val.toFixed(2)),
        predictedKWh: null,
        lowerBound: null,
        upperBound: null,
      });
    }

    // Bridge point: last historical point anchors prediction
    if (sortedHistory.length > 0 && forecast.dailyForecasts.length > 0) {
      const lastHistVal = sortedHistory[sortedHistory.length - 1][1];
      const lastHistLabel = combined[combined.length - 1].label;
      combined[combined.length - 1].predictedKWh = Number(lastHistVal.toFixed(2));
    }

    // Add forecast days
    for (const f of forecast.dailyForecasts) {
      const d = new Date(f.date);
      combined.push({
        label: `${f.dayName} ${d.getMonth() + 1}/${d.getDate()}`,
        historicalKWh: null,
        predictedKWh: f.predictedKWh,
        lowerBound: f.lowerBoundKWh,
        upperBound: f.upperBoundKWh,
      });
    }

    return combined;
  }, [datasets, forecast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AI Energy Prediction
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Transparent mathematical forecasting utilizing rolling averages, day-of-week stratification, and bounded trend models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Horizon Switcher */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-[#0B1220]">
            {([7, 15, 30] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodDays(p)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  periodDays === p
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-white'
                }`}
              >
                {p} Days
              </button>
            ))}
          </div>

          <button
            onClick={() => exportService.exportPredictionResults(forecast)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Forecast</span>
          </button>
        </div>
      </div>

      {/* FALLBACK WARNING IF HISTORY INSUFFICIENT */}
      {forecast.dataCoverageDays < 3 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Limited Historical Coverage ({forecast.dataCoverageDays} days): </span>
            Fewer than 3 distinct days of telemetry were detected. The system is generating a standardized 3BHK residential baseline forecast. For higher precision, generate at least 7 to 30 days in the Synthetic Data Generator.
          </div>
        </div>
      )}

      {/* 4 PREDICTION KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Predicted Total Energy ({periodDays}d)
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {forecast.totalPredictedKWh.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">kWh</span>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">
            Avg {forecast.avgDailyPredictedKWh} kWh/day
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Predicted Cost ({periodDays}d)
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-teal-500 dark:text-teal-400 font-mono">
              ₹{Math.round(forecast.totalPredictedCostINR).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">INR</span>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">
            Evaluated against active {tariffSettings.mode} tariff
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Identified Trend
          </span>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant={
                forecast.trend === 'increasing'
                  ? 'warning'
                  : forecast.trend === 'decreasing'
                  ? 'success'
                  : 'neutral'
              }
              size="md"
            >
              {forecast.trend.toUpperCase()}
            </Badge>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">
            Slope based on recent 7-day rolling window
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Forecast Confidence
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-500 font-mono">
              {forecast.confidencePercentage}%
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-2 block">
            Confidence interval ±8% to ±14%
          </span>
        </div>
      </div>

      {/* COMBINED HISTORICAL VS PREDICTED TIME-SERIES CHART */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Historical Consumption vs Future Forecast Horizon
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grey line depicts observed historical history; dashed cyan line depicts projected daily load with confidence boundaries
            </p>
          </div>
          <Badge variant="teal" size="sm">
            {periodDays}-Day Horizon
          </Badge>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="label" stroke={axisColor} fontSize={10} />
              <YAxis stroke={axisColor} fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
                  borderColor: isDark ? '#1E293B' : '#CBD5E1',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />

              {/* Uncertainty Band */}
              <Area
                type="monotone"
                dataKey="upperBound"
                fill="#14B8A6"
                fillOpacity={0.15}
                stroke="none"
                name="Confidence Upper (95%)"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                fill="#14B8A6"
                fillOpacity={0.1}
                stroke="none"
                name="Confidence Lower (95%)"
              />

              {/* Historical Line */}
              <Line
                type="monotone"
                dataKey="historicalKWh"
                stroke="#64748B"
                strokeWidth={2}
                dot={{ r: 3, fill: '#64748B' }}
                name="Observed History (kWh)"
              />

              {/* Predicted Forecast Line */}
              <Line
                type="monotone"
                dataKey="predictedKWh"
                stroke="#14B8A6"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#14B8A6' }}
                name="Projected Forecast (kWh)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* METHODOLOGY & LIMITATIONS METADATA CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Methodology & Mathematical Assumptions</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {forecast.methodology}
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
            {forecast.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Academic Integrity & Limitations</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            This module generates an estimated mathematical forecast using time-series decomposition. It does not present unvalidated blackbox neural claims.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
            {forecast.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
