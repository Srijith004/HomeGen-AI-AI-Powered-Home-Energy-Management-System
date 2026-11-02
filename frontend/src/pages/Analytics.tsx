import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  Filter,
  Flame,
  Zap,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Home,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { ROOMS, CATEGORIES } from '../constants/defaultData';
import { Badge } from '../components/common/Badge';

export const Analytics: React.FC = () => {
  const { datasets, appliances, theme } = useEnergy();

  // Filters state
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'ALL'>('30');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#64748B' : '#94A3B8';
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';

  // Filtered dataset according to selected range and room/category
  const filteredRecords = useMemo(() => {
    if (datasets.length === 0) return [];

    let subset = datasets;

    // Time filtering
    if (timeRange !== 'ALL') {
      const days = parseInt(timeRange);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      subset = subset.filter(r => r.timestamp >= cutoff);
    }

    // Room filtering
    if (selectedRoom !== 'ALL') {
      subset = subset.filter(r => r.room === selectedRoom);
    }

    // Category filtering
    if (selectedCategory !== 'ALL') {
      subset = subset.filter(r => r.category === selectedCategory);
    }

    return subset;
  }, [datasets, timeRange, selectedRoom, selectedCategory]);

  // 1. Hourly Profile
  const hourlyData = useMemo(() => {
    const hours = new Array(24).fill(0);
    const counts = new Array(24).fill(0);

    for (const r of filteredRecords) {
      const h = new Date(r.timestamp).getHours();
      hours[h] += r.energyKWh;
      counts[h]++;
    }

    return hours.map((tot, h) => ({
      hour: `${h.toString().padStart(2, '0')}:00`,
      energyKWh: Number((counts[h] > 0 ? tot / (counts[h] / 5 || 1) : 0).toFixed(3)),
    }));
  }, [filteredRecords]);

  // 2. Day of Week Profile
  const dayOfWeekData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sums = new Array(7).fill(0);
    const counts = new Array(7).fill(0);

    for (const r of filteredRecords) {
      const d = new Date(r.timestamp).getDay();
      sums[d] += r.energyKWh;
      counts[d]++;
    }

    return dayNames.map((name, idx) => ({
      day: name,
      avgDailyKWh: Number((counts[idx] > 0 ? (sums[idx] / counts[idx]) * 24 : 0).toFixed(2)),
    }));
  }, [filteredRecords]);

  // 3. Room-wise Consumption
  const roomData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredRecords) {
      map.set(r.room, (map.get(r.room) || 0) + r.energyKWh);
    }
    const COLORS = ['#14B8A6', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
    return Array.from(map.entries())
      .map(([name, val], idx) => ({
        name,
        value: Number(val.toFixed(2)),
        color: COLORS[idx % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  // 4. Category-wise Cost & Consumption
  const categoryData = useMemo(() => {
    const map = new Map<string, { energy: number; cost: number }>();
    for (const r of filteredRecords) {
      const cur = map.get(r.category) || { energy: 0, cost: 0 };
      map.set(r.category, {
        energy: cur.energy + r.energyKWh,
        cost: cur.cost + r.estimatedCostINR,
      });
    }

    return Array.from(map.entries()).map(([name, val]) => ({
      category: name,
      energyKWh: Number(val.energy.toFixed(2)),
      costINR: Number(val.cost.toFixed(2)),
    }));
  }, [filteredRecords]);

  // Peak Identification
  const peakStats = useMemo(() => {
    if (filteredRecords.length === 0) return { peakPowerW: 0, peakTime: 'N/A', peakAppliance: 'N/A' };
    let maxRec = filteredRecords[0];
    for (const r of filteredRecords) {
      if (r.operatingPowerW > maxRec.operatingPowerW) {
        maxRec = r;
      }
    }
    return {
      peakPowerW: maxRec.operatingPowerW,
      peakTime: new Date(maxRec.timestamp).toLocaleString(),
      peakAppliance: maxRec.applianceName,
    };
  }, [filteredRecords]);

  const totalFilteredUnits = filteredRecords.reduce((s, r) => s + r.energyKWh, 0);
  const totalFilteredCost = filteredRecords.reduce((s, r) => s + r.estimatedCostINR, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Energy Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Multi-dimensional analytical breakdowns across rooms, schedules, days, and cost drivers.
          </p>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-teal-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">Filter By:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-[#0B1220]">
            {(['7', '30', '90', 'ALL'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  timeRange === range
                    ? 'bg-teal-500 text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range === 'ALL' ? 'All' : `${range}d`}
              </button>
            ))}
          </div>

          {/* Room filter */}
          <select
            value={selectedRoom}
            onChange={e => setSelectedRoom(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
          >
            <option value="ALL">All Rooms</option>
            {ROOMS.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
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

      {/* KPI HIGHLIGHT STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Filtered Consumption
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {totalFilteredUnits.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">kWh</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Filtered Energy Cost
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-500 font-mono">
              ₹{Math.round(totalFilteredCost).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">INR</span>
          </div>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Peak Recorded Spike
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-amber-500 font-mono">
              {peakStats.peakPowerW} W
            </span>
            <span className="text-xs text-slate-400 truncate">({peakStats.peakAppliance})</span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Diurnal Hourly Area Chart */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Hourly Load Curve (kWh per Hour)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Identifies peak evening ramp-up (6 PM - 10 PM) and morning water heating spikes
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="energyKWh"
                  stroke="#14B8A6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEnergy)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Day-of-Week Stratification Bar Chart */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Day-of-Week Behavior Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Highlights weekend vs weekday consumption divergence
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} kWh`, 'Avg Daily']}
                />
                <Bar dataKey="avgDailyKWh" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Room-wise Donut Breakdown */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Room-wise Energy Distribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Comparison of energy usage across 3 bedrooms, living room, and utility areas
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {roomData.map((entry, idx) => (
                    <Cell key={`room-cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} kWh`, 'Energy']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Category-wise Cost & Consumption */}
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Category Breakdown & Cost (₹)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Direct comparison between Cooling, Lighting, Water Systems, and Appliances
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis type="number" stroke={axisColor} fontSize={11} />
                <YAxis dataKey="category" type="category" stroke={axisColor} fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
                    borderColor: isDark ? '#1E293B' : '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'costINR' ? `₹${val}` : `${val} kWh`,
                    name === 'costINR' ? 'Estimated Cost' : 'Consumption',
                  ]}
                />
                <Bar dataKey="costINR" fill="#F59E0B" radius={[0, 4, 4, 0]} name="costINR" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
