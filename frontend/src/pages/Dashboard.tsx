import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Activity,
  Receipt,
  ToggleLeft,
  Leaf,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEnergy } from '../context/EnergyContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const {
    appliances,
    datasets,
    totalCurrentPowerDemandKW,
    currentEfficiencyScore,
    currentBill,
    scenarioComparison,
    theme,
  } = useEnergy();

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#64748B' : '#94A3B8';
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';

  // 1. Hourly Energy Aggregation (24 hours profile)
  const hourlyData = useMemo(() => {
    if (datasets.length === 0) return [];
    const hourMap = new Array(24).fill(0);
    const hourCounts = new Array(24).fill(0);

    for (const r of datasets) {
      const h = new Date(r.timestamp).getHours();
      hourMap[h] += r.energyKWh;
      hourCounts[h]++;
    }

    return hourMap.map((totalKWh, h) => {
      const avgKWh = hourCounts[h] > 0 ? totalKWh / (hourCounts[h] / appliances.length) : totalKWh;
      const hourStr = `${h.toString().padStart(2, '0')}:00`;
      return {
        hour: hourStr,
        energyKWh: Number(avgKWh.toFixed(3)),
      };
    });
  }, [datasets, appliances.length]);

  // 2. Appliance-wise Donut Consumption
  const applianceDonutData = useMemo(() => {
    if (datasets.length === 0) return [];
    const map = new Map<string, number>();

    for (const r of datasets) {
      map.set(r.applianceName, (map.get(r.applianceName) || 0) + r.energyKWh);
    }

    const COLORS = [
      '#14B8A6',
      '#10B981',
      '#3B82F6',
      '#8B5CF6',
      '#F59E0B',
      '#EC4899',
      '#06B6D4',
      '#84CC16',
      '#6366F1',
      '#F97316',
    ];

    const sorted = Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);

    // Top 5 + Others
    if (sorted.length > 5) {
      const top5 = sorted.slice(0, 5);
      const otherVal = sorted.slice(5).reduce((s, i) => s + i.value, 0);
      top5.push({ name: 'Other Appliances', value: Number(otherVal.toFixed(2)) });
      return top5.map((item, idx) => ({ ...item, color: COLORS[idx % COLORS.length] }));
    }

    return sorted.map((item, idx) => ({ ...item, color: COLORS[idx % COLORS.length] }));
  }, [datasets]);

  // 3. Daily Energy Consumption Bar Chart
  const dailyData = useMemo(() => {
    if (datasets.length === 0) return [];
    const map = new Map<string, { energyKWh: number; costINR: number }>();

    for (const r of datasets) {
      const dateKey = r.timestamp.split('T')[0];
      const cur = map.get(dateKey) || { energyKWh: 0, costINR: 0 };
      map.set(dateKey, {
        energyKWh: cur.energyKWh + r.energyKWh,
        costINR: cur.costINR + r.estimatedCostINR,
      });
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // Last 14 days
      .map(([date, val]) => {
        const shortDate = new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        return {
          date: shortDate,
          energyKWh: Number(val.energyKWh.toFixed(2)),
          costINR: Number(val.costINR.toFixed(2)),
        };
      });
  }, [datasets]);

  // 4. Power Demand Trend
  const powerTrendData = useMemo(() => {
    if (datasets.length === 0) return [];
    // Take recent 24 records grouped by timestamp
    const timeMap = new Map<string, number>();
    for (const r of datasets) {
      timeMap.set(r.timestamp, (timeMap.get(r.timestamp) || 0) + r.operatingPowerW);
    }

    return Array.from(timeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24)
      .map(([ts, totalW]) => {
        const d = new Date(ts);
        const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        return {
          time: timeLabel,
          demandKW: Number((totalW / 1000).toFixed(3)),
        };
      });
  }, [datasets]);

  // Statistics
  const activeAppliancesCount = appliances.filter(a => a.status === 'ON' && a.isEnabled).length;
  const totalDatasetUnits = datasets.reduce((s, r) => s + r.energyKWh, 0);

  // Top / Least consuming appliances
  const { topConsumer, leastConsumer } = useMemo(() => {
    if (datasets.length === 0) return { topConsumer: null, leastConsumer: null };
    const map = new Map<string, number>();
    for (const r of datasets) {
      map.set(r.applianceName, (map.get(r.applianceName) || 0) + r.energyKWh);
    }
    const arr = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return {
      topConsumer: arr.length > 0 ? { name: arr[0][0], value: arr[0][1] } : null,
      leastConsumer: arr.length > 0 ? { name: arr[arr.length - 1][0], value: arr[arr.length - 1][1] } : null,
    };
  }, [datasets]);

  return (
    <div className="space-y-6">
      {/* Header / Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Overview Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time simulated telemetry, load demand, billing estimates, and efficiency KPIs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/generator"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition"
          >
            <Activity className="w-4 h-4" />
            <span>Generate Data</span>
          </Link>
          <Link
            to="/simulator"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
          >
            <Zap className="w-4 h-4" />
            <span>Smart Home Simulator</span>
          </Link>
        </div>
      </div>

      {/* 6 MAIN KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Energy"
          value={totalDatasetUnits > 0 ? totalDatasetUnits.toFixed(1) : '0.0'}
          unit="kWh"
          icon={Zap}
          colorScheme="teal"
          trend={{
            value: `${currentBill.avgDailyUnitsKWh.toFixed(1)} kWh/day`,
            isPositive: true,
            label: 'Avg daily',
          }}
        />

        <StatCard
          title="Current Demand"
          value={totalCurrentPowerDemandKW.toFixed(3)}
          unit="kW"
          icon={Activity}
          colorScheme={totalCurrentPowerDemandKW > 4.0 ? 'amber' : 'emerald'}
          trend={{
            value: `${Math.round((totalCurrentPowerDemandKW / 5.0) * 100)}%`,
            isPositive: totalCurrentPowerDemandKW <= 4.0,
            label: 'of 5kW limit',
          }}
        />

        <StatCard
          title="Estimated Bill"
          value={`₹${Math.round(currentBill.totalBillINR).toLocaleString('en-IN')}`}
          unit={`/${currentBill.mode}`}
          icon={Receipt}
          colorScheme="indigo"
          subtitle={`₹${currentBill.avgDailyCostINR.toFixed(1)}/day average`}
        />

        <StatCard
          title="Active Devices"
          value={`${activeAppliancesCount} / ${appliances.length}`}
          unit="appliances"
          icon={ToggleLeft}
          colorScheme="blue"
          subtitle={`${appliances.length - activeAppliancesCount} devices idle/off`}
        />

        <StatCard
          title="Energy Saved"
          value={scenarioComparison.dailyEnergySavedKWh.toFixed(1)}
          unit="kWh/day"
          icon={Leaf}
          colorScheme="emerald"
          trend={{
            value: `${scenarioComparison.savingsPercentage}%`,
            isPositive: true,
            label: 'scenario delta',
          }}
        />

        <StatCard
          title="Efficiency Score"
          value={`${currentEfficiencyScore} / 100`}
          unit=""
          icon={ShieldCheck}
          colorScheme={currentEfficiencyScore >= 75 ? 'emerald' : 'amber'}
          trend={{
            value: currentEfficiencyScore >= 80 ? 'Optimal' : 'Moderate',
            isPositive: currentEfficiencyScore >= 80,
            label: 'rating',
          }}
        />
      </div>

      {/* CHARTS ROW 1: Hourly Consumption + Appliance Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Chart */}
        <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Household Energy Consumption Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Average diurnal hourly distribution (kWh per hour)
              </p>
            </div>
            <Badge variant="teal" size="sm">
              Diurnal Cycle
            </Badge>
          </div>

          <div className="h-64 w-full">
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="hour" stroke={axisColor} fontSize={11} />
                  <YAxis stroke={axisColor} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} kWh`, 'Energy']}
                  />
                  <Line
                    type="monotone"
                    dataKey="energyKWh"
                    stroke="#14B8A6"
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: '#14B8A6' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No telemetry available. Generate synthetic dataset.
              </div>
            )}
          </div>
        </div>

        {/* Appliance Donut Chart */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Appliance Energy Share
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Percentage contribution by appliance
              </p>
            </div>
          </div>

          <div className="h-56 w-full relative">
            {applianceDonutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={applianceDonutData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {applianceDonutData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} kWh`, 'Consumption']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No records to plot.
              </div>
            )}
          </div>

          {/* Legend Chips */}
          <div className="space-y-1.5 mt-2">
            {applianceDonutData.slice(0, 4).map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white font-mono shrink-0">
                  {item.value} kWh
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: Daily Consumption Bar Chart + Power Demand Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Bar Chart */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Daily Consumption Comparison
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Date-wise household energy consumption (kWh)
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              Past 14 Days
            </Badge>
          </div>

          <div className="h-60 w-full">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" stroke={axisColor} fontSize={11} />
                  <YAxis stroke={axisColor} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} kWh`, 'Energy']}
                  />
                  <Bar dataKey="energyKWh" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No daily history found.
              </div>
            )}
          </div>
        </div>

        {/* Power Demand Trend Line Chart */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Simulated Power Demand Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simulated active load demand over recent intervals (kW)
              </p>
            </div>
            <Badge variant="teal" size="sm">
              Live Trend
            </Badge>
          </div>

          <div className="h-60 w-full">
            {powerTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={powerTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="time" stroke={axisColor} fontSize={11} />
                  <YAxis stroke={axisColor} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} kW`, 'Power Demand']}
                  />
                  <Line
                    type="monotone"
                    dataKey="demandKW"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No power trend data.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADDITIONAL SECTIONS: Top Consumers & AI Insights Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Extremes Card */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Appliance Consumption Extremes
          </h2>

          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
              <Flame className="w-4 h-4" />
              <span>Highest Energy Consumer</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {topConsumer ? topConsumer.name : 'N/A'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {topConsumer ? `${topConsumer.value.toFixed(2)} kWh total` : 'No dataset'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Leaf className="w-4 h-4" />
              <span>Lowest Energy Consumer</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {leastConsumer ? leastConsumer.name : 'N/A'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {leastConsumer ? `${leastConsumer.value.toFixed(2)} kWh total` : 'No dataset'}
            </p>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Targeting the top consumer with schedule setpoints can lower overall slab tiers.
          </div>
        </div>

        {/* AI Recommendations Teaser */}
        <div className="lg:col-span-2 bg-gradient-to-br from-teal-950/40 via-slate-900/60 to-indigo-950/40 border border-teal-500/30 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-400">
                <Leaf className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  AI Energy Recommendations
                </span>
              </div>
              <Badge variant="teal" size="sm">
                Google Gemini Integrated
              </Badge>
            </div>

            <h3 className="mt-3 text-lg font-bold text-white">
              Save up to ₹420 / month on cooling & water heating
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed max-w-2xl">
              Setting master air conditioner temperature to 24°C instead of 20°C reduces peak continuous inverter load by 24%. Combined with automated timer-cutoff on geysers, your household avoids pushing into the highest ₹6.00/unit slab tier.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-200 bg-white/5 p-2.5 rounded-lg border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Shift geyser operation to 25m pre-bath cycle</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200 bg-white/5 p-2.5 rounded-lg border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Eliminate entertainment standby at night</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-700/50">
            <span className="text-xs text-slate-400">
              Interactive consultation available in Gemini Assistant
            </span>
            <Link
              to="/ai-assistant"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition"
            >
              <span>Consult Gemini Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
