import { Appliance, BillCalculationResult, PredictionResult, ScenarioComparisonResult, SyntheticRecord } from '../types';

export class ExportService {
  /**
   * Helper to trigger a client-side download of a CSV text file.
   */
  public downloadCsv(filename: string, csvContent: string): void {
    const bom = '\uFEFF'; // UTF-8 byte order mark for Excel compatibility
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Escapes a single CSV cell value.
   */
  public escapeCell(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * 1. Export Complete Household Energy Dataset
   */
  public exportCompleteDataset(records: SyntheticRecord[]): void {
    const headers = [
      'Record ID',
      'Timestamp (ISO)',
      'Appliance ID',
      'Appliance Name',
      'Room',
      'Category',
      'Rated Power (W)',
      'Operating Power (W)',
      'Energy (kWh)',
      'Status',
      'Duration (Minutes)',
      'Tariff Category',
      'Estimated Cost (INR)',
      'Dataset Type',
    ];

    const rows = records.map(r => [
      this.escapeCell(r.recordId),
      this.escapeCell(r.timestamp),
      this.escapeCell(r.applianceId),
      this.escapeCell(r.applianceName),
      this.escapeCell(r.room),
      this.escapeCell(r.category),
      r.ratedPowerW,
      r.operatingPowerW,
      r.energyKWh,
      this.escapeCell(r.operatingStatus),
      r.usageDurationMinutes,
      this.escapeCell(r.tariffCategory),
      r.estimatedCostINR,
      this.escapeCell(r.datasetType),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    this.downloadCsv(`homegen_synthetic_energy_dataset_${Date.now()}.csv`, csvContent);
  }

  /**
   * 2. Export Appliance-wise Consumption
   */
  public exportApplianceSummary(
    appliances: Appliance[],
    records: SyntheticRecord[]
  ): void {
    const appMap = new Map<string, { totalKWh: number; totalCost: number; activeMinutes: number }>();
    for (const r of records) {
      const cur = appMap.get(r.applianceId) || { totalKWh: 0, totalCost: 0, activeMinutes: 0 };
      appMap.set(r.applianceId, {
        totalKWh: cur.totalKWh + r.energyKWh,
        totalCost: cur.totalCost + r.estimatedCostINR,
        activeMinutes: cur.activeMinutes + (r.operatingStatus === 'ON' ? r.usageDurationMinutes : 0),
      });
    }

    const headers = [
      'Appliance ID',
      'Appliance Name',
      'Category',
      'Room',
      'Rated Power (W)',
      'Operating Power (W)',
      'Quantity',
      'Status',
      'Total Energy (kWh)',
      'Total Estimated Cost (INR)',
      'Active Operating Hours',
    ];

    const rows = appliances.map(a => {
      const stats = appMap.get(a.id) || { totalKWh: 0, totalCost: 0, activeMinutes: 0 };
      return [
        this.escapeCell(a.id),
        this.escapeCell(a.name),
        this.escapeCell(a.category),
        this.escapeCell(a.room),
        a.ratedPowerW,
        a.operatingPowerW,
        a.quantity,
        this.escapeCell(a.status),
        Number(stats.totalKWh.toFixed(3)),
        Number(stats.totalCost.toFixed(2)),
        Number((stats.activeMinutes / 60).toFixed(1)),
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    this.downloadCsv(`homegen_appliance_consumption_${Date.now()}.csv`, csvContent);
  }

  /**
   * 3. Export Daily Consumption Summary
   */
  public exportDailySummary(records: SyntheticRecord[]): void {
    const dailyMap = new Map<string, { totalKWh: number; totalCost: number; peakPowerW: number }>();

    for (const r of records) {
      const dateStr = r.timestamp.split('T')[0];
      const cur = dailyMap.get(dateStr) || { totalKWh: 0, totalCost: 0, peakPowerW: 0 };
      dailyMap.set(dateStr, {
        totalKWh: cur.totalKWh + r.energyKWh,
        totalCost: cur.totalCost + r.estimatedCostINR,
        peakPowerW: Math.max(cur.peakPowerW, r.operatingPowerW),
      });
    }

    const headers = ['Date', 'Day of Week', 'Total Energy (kWh)', 'Peak Power Demand (W)', 'Estimated Cost (INR)'];
    const sortedDates = Array.from(dailyMap.keys()).sort();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const rows = sortedDates.map(d => {
      const stats = dailyMap.get(d)!;
      const day = dayNames[new Date(d).getDay()];
      return [
        this.escapeCell(d),
        this.escapeCell(day),
        Number(stats.totalKWh.toFixed(3)),
        Number(stats.peakPowerW.toFixed(1)),
        Number(stats.totalCost.toFixed(2)),
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    this.downloadCsv(`homegen_daily_energy_summary_${Date.now()}.csv`, csvContent);
  }

  /**
   * 4. Export Electricity Bill Breakdown
   */
  public exportBillBreakdown(bill: BillCalculationResult): void {
    const headers = ['Billing Metric', 'Value', 'Unit / Currency'];
    const rows = [
      ['Tariff Mode', bill.mode.toUpperCase(), 'Mode'],
      ['Total Energy Billed', bill.totalUnitsKWh, 'kWh (Units)'],
      ['Energy Charge', bill.energyChargeINR, 'INR (₹)'],
      ['Fixed Monthly Charge', bill.fixedChargeINR, 'INR (₹)'],
      ['Additional Surcharges', bill.additionalChargesINR, 'INR (₹)'],
      ['Tax / Duty', bill.surchargeINR, 'INR (₹)'],
      ['Net Total Estimated Bill', bill.totalBillINR, 'INR (₹)'],
      ['Average Daily Consumption', bill.avgDailyUnitsKWh, 'kWh/day'],
      ['Average Daily Cost', bill.avgDailyCostINR, 'INR/day'],
      ['Projected Monthly Units', bill.projectedMonthlyUnitsKWh, 'kWh/month'],
      ['Projected Monthly Bill', bill.projectedMonthlyCostINR, 'INR/month'],
    ];

    if (bill.slabBreakdown) {
      rows.push(['--- SLAB BREAKDOWN ---', '', '']);
      for (const slab of bill.slabBreakdown) {
        rows.push([slab.slabLabel, `${slab.unitsBilled} units @ ₹${slab.rate}/unit = ₹${slab.amountINR}`, 'INR (₹)']);
      }
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.map(this.escapeCell).join(','))].join('\n');
    this.downloadCsv(`homegen_electricity_bill_statement_${Date.now()}.csv`, csvContent);
  }

  /**
   * 5. Export Energy Prediction Results
   */
  public exportPredictionResults(prediction: PredictionResult): void {
    const headers = [
      'Forecast Date',
      'Day Name',
      'Is Weekend',
      'Predicted Energy (kWh)',
      'Lower Bound 95% (kWh)',
      'Upper Bound 95% (kWh)',
      'Estimated Daily Cost (INR)',
    ];

    const rows = prediction.dailyForecasts.map(d => [
      this.escapeCell(d.date),
      this.escapeCell(d.dayName),
      d.isWeekend ? 'Yes' : 'No',
      d.predictedKWh,
      d.lowerBoundKWh,
      d.upperBoundKWh,
      d.predictedCostINR,
    ]);

    const summaryRows = [
      [],
      ['Forecast Period', `${prediction.periodDays} Days`, '', '', '', '', ''],
      ['Total Predicted Energy', `${prediction.totalPredictedKWh} kWh`, '', '', '', '', ''],
      ['Total Estimated Cost', `INR ${prediction.totalPredictedCostINR}`, '', '', '', '', ''],
      ['Average Daily Energy', `${prediction.avgDailyPredictedKWh} kWh/day`, '', '', '', '', ''],
      ['Identified Trend', prediction.trend, '', '', '', '', ''],
      ['Confidence Score', `${prediction.confidencePercentage}%`, '', '', '', '', ''],
      ['Methodology', this.escapeCell(prediction.methodology), '', '', '', '', ''],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      ...summaryRows.map(r => r.join(',')),
    ].join('\n');

    this.downloadCsv(`homegen_energy_prediction_${prediction.periodDays}d_${Date.now()}.csv`, csvContent);
  }

  /**
   * 6. Export Scenario Comparison
   */
  public exportScenarioComparison(comparisons: ScenarioComparisonResult[]): void {
    const headers = [
      'Scenario ID',
      'Scenario Name',
      'Description',
      'Baseline Daily Energy (kWh)',
      'Scenario Daily Energy (kWh)',
      'Daily Energy Saved (kWh)',
      'Savings Percentage (%)',
      'Baseline Daily Cost (INR)',
      'Scenario Daily Cost (INR)',
      'Daily Cost Saved (INR)',
      'Monthly Energy Saved (kWh)',
      'Monthly Cost Saved (INR)',
    ];

    const rows = comparisons.map(c => [
      this.escapeCell(c.scenarioId),
      this.escapeCell(c.scenarioName),
      this.escapeCell(c.description),
      c.baselineDailyKWh,
      c.scenarioDailyKWh,
      c.dailyEnergySavedKWh,
      c.savingsPercentage,
      c.baselineDailyCostINR,
      c.scenarioDailyCostINR,
      c.dailyCostSavedINR,
      c.monthlyEnergySavedKWh,
      c.monthlyCostSavedINR,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(',')),].join('\n');
    this.downloadCsv(`homegen_scenario_comparison_${Date.now()}.csv`, csvContent);
  }
}

export const exportService = new ExportService();
