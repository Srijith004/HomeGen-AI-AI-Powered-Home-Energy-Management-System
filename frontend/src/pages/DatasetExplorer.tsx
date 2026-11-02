import React, { useState, useMemo } from 'react';
import {
  TableProperties,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Zap,
  Info,
} from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { exportService } from '../services/exportService';
import { ROOMS } from '../constants/defaultData';
import { Badge } from '../components/common/Badge';

export const DatasetExplorer: React.FC = () => {
  const { datasets, appliances } = useEnergy();

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roomFilter, setRoomFilter] = useState<string>('ALL');
  const [applianceFilter, setApplianceFilter] = useState<string>('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Dataset statistics summary
  const summary = useMemo(() => {
    if (datasets.length === 0) {
      return {
        totalRecords: 0,
        totalEnergyKWh: 0,
        avgEnergyKWh: 0,
        maxEnergyKWh: 0,
        minEnergyKWh: 0,
        startDate: 'N/A',
        endDate: 'N/A',
      };
    }

    let total = 0;
    let max = -Infinity;
    let min = Infinity;

    for (const r of datasets) {
      total += r.energyKWh;
      if (r.energyKWh > max) max = r.energyKWh;
      if (r.energyKWh < min) min = r.energyKWh;
    }

    const firstTime = datasets[0].timestamp;
    const lastTime = datasets[datasets.length - 1].timestamp;

    return {
      totalRecords: datasets.length,
      totalEnergyKWh: Number(total.toFixed(2)),
      avgEnergyKWh: Number((total / datasets.length).toFixed(4)),
      maxEnergyKWh: Number(max.toFixed(4)),
      minEnergyKWh: Number(min.toFixed(4)),
      startDate: new Date(firstTime).toLocaleDateString(),
      endDate: new Date(lastTime).toLocaleDateString(),
    };
  }, [datasets]);

  // Filtered & Sorted dataset
  const filteredRecords = useMemo(() => {
    return datasets
      .filter(r => {
        if (statusFilter !== 'ALL' && r.operatingStatus !== statusFilter) return false;
        if (roomFilter !== 'ALL' && r.room !== roomFilter) return false;
        if (applianceFilter !== 'ALL' && r.applianceId !== applianceFilter) return false;
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          return (
            r.applianceName.toLowerCase().includes(q) ||
            r.room.toLowerCase().includes(q) ||
            r.timestamp.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = (a as any)[sortField];
        let valB: any = (b as any)[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [datasets, statusFilter, roomFilter, applianceFilter, searchTerm, sortField, sortOrder]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dataset Explorer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Granular inspection of generated household energy intervals with search, sort, and export.
          </p>
        </div>

        {datasets.length > 0 && (
          <button
            onClick={() => exportService.exportCompleteDataset(filteredRecords)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Filtered CSV ({filteredRecords.length})</span>
          </button>
        )}
      </div>

      {/* DATASET SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs text-xs">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">
            Total Records
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-1 block">
            {summary.totalRecords.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs text-xs">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">
            Total Consumption
          </span>
          <span className="text-lg font-bold text-teal-500 dark:text-teal-400 font-mono mt-1 block">
            {summary.totalEnergyKWh} kWh
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs text-xs">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">
            Average per Interval
          </span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono mt-1 block">
            {summary.avgEnergyKWh} kWh
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs text-xs">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">
            Max Interval
          </span>
          <span className="text-lg font-bold text-amber-500 font-mono mt-1 block">
            {summary.maxEnergyKWh} kWh
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs text-xs">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">
            Start Date
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 block">
            {summary.startDate}
          </span>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs text-xs">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">
            End Date
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 block">
            {summary.endDate}
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by appliance, room, or timestamp..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ON">ON</option>
              <option value="OFF">OFF</option>
              <option value="STANDBY">Standby</option>
            </select>

            <select
              value={roomFilter}
              onChange={e => {
                setRoomFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Rooms</option>
              {ROOMS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={applianceFilter}
              onChange={e => {
                setApplianceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Appliances</option>
              {appliances.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Matched <strong>{filteredRecords.length}</strong> records
          </span>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-900 dark:text-slate-100"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#FFFFFF] dark:bg-[#111C2E] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50 dark:bg-[#0B1220]/60">
                <th
                  onClick={() => handleSort('timestamp')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Timestamp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('applianceName')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Appliance</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Room</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Rated Power</th>
                <th
                  onClick={() => handleSort('operatingPowerW')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Operating Power</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('energyKWh')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Energy (kWh)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('estimatedCostINR')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Est. Cost (₹)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map(r => (
                  <tr key={r.recordId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                      {r.applianceName}
                    </td>
                    <td className="py-2.5 px-3">{r.room}</td>
                    <td className="py-2.5 px-3 text-slate-400">{r.category}</td>
                    <td className="py-2.5 px-3 font-mono">{r.ratedPowerW} W</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-teal-500 dark:text-teal-400">
                      {r.operatingPowerW} W
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                      {r.energyKWh}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-emerald-500">
                      ₹{r.estimatedCostINR.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
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
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] text-slate-400 font-mono">{r.datasetType}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-xs text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50 dark:bg-[#0B1220]/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
