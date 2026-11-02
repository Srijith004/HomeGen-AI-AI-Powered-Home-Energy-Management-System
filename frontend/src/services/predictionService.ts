import { DailyPrediction, PredictionResult, SyntheticRecord, TariffSettings } from '../types';
import { calculateElectricityBill } from '../utils/calculations';

export class PredictionService {
  /**
   * Generates a 7, 15, or 30-day forecast using a moving average,
   * weekday/weekend behavioral weighting, and bounded trend adjustment.
   */
  public generateForecast(
    records: SyntheticRecord[],
    periodDays: 7 | 15 | 30,
    tariffSettings: TariffSettings,
    customTrendMultiplier: number = 1.0
  ): PredictionResult {
    const dailyMap = new Map<string, number>();

    // 1. Group records by calendar date (YYYY-MM-DD)
    for (const rec of records) {
      const dateKey = rec.timestamp.split('T')[0];
      const current = dailyMap.get(dateKey) || 0;
      dailyMap.set(dateKey, current + rec.energyKWh);
    }

    const sortedDates = Array.from(dailyMap.keys()).sort();
    const dataCoverageDays = sortedDates.length;

    // Check if sufficient history is present (at least 3 days)
    const isFallback = dataCoverageDays < 3;
    let baselineDailyKWh = 15.2; // typical 3BHK benchmark baseline
    let weekdayAvg = 14.5;
    let weekendAvg = 16.8;
    let trendFactor = 0;

    if (!isFallback) {
      const dailyValues = sortedDates.map(d => dailyMap.get(d)!);

      // Moving average of recent days (up to 7 days)
      const recentWindow = dailyValues.slice(-7);
      baselineDailyKWh = recentWindow.reduce((a, b) => a + b, 0) / recentWindow.length;

      // Weekday vs weekend averages
      let weekdaySum = 0;
      let weekdayCount = 0;
      let weekendSum = 0;
      let weekendCount = 0;

      for (const d of sortedDates) {
        const dateObj = new Date(d);
        const day = dateObj.getDay();
        const val = dailyMap.get(d)!;
        if (day === 0 || day === 6) {
          weekendSum += val;
          weekendCount++;
        } else {
          weekdaySum += val;
          weekdayCount++;
        }
      }

      weekdayAvg = weekdayCount > 0 ? weekdaySum / weekdayCount : baselineDailyKWh;
      weekendAvg = weekendCount > 0 ? weekendSum / weekendCount : baselineDailyKWh * 1.15;

      // Linear trend slope from recent window
      if (recentWindow.length >= 4) {
        const n = recentWindow.length;
        const xMean = (n - 1) / 2;
        const yMean = baselineDailyKWh;
        let num = 0;
        let den = 0;
        for (let i = 0; i < n; i++) {
          num += (i - xMean) * (recentWindow[i] - yMean);
          den += (i - xMean) * (i - xMean);
        }
        const slope = den !== 0 ? num / den : 0;
        // Bound daily slope change to [-3%, +3%] per day
        trendFactor = Math.max(-0.03, Math.min(0.03, slope / baselineDailyKWh));
      }
    }

    // Generate daily forecast forward starting tomorrow
    const dailyForecasts: DailyPrediction[] = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const effectiveRate = tariffSettings.mode === 'flat' ? tariffSettings.flatRate : 4.5;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 1; i <= periodDays; i++) {
      const targetDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
      const dayName = dayNames[targetDate.getDay()];
      const dateStr = targetDate.toISOString().split('T')[0];

      // Day-type baseline weighted with overall moving average
      const baseForDay = isWeekend ? weekendAvg : weekdayAvg;
      // Compounded bounded trend
      const trendAdjustment = Math.pow(1 + trendFactor * customTrendMultiplier, i);
      const predictedKWh = Number((baseForDay * trendAdjustment).toFixed(2));

      // Uncertainty expands further into the future (5% base up to 15%)
      const uncertaintyPct = 0.05 + (i / periodDays) * 0.1;
      const lowerBoundKWh = Number(Math.max(0, predictedKWh * (1 - uncertaintyPct)).toFixed(2));
      const upperBoundKWh = Number((predictedKWh * (1 + uncertaintyPct)).toFixed(2));
      const predictedCostINR = Number((predictedKWh * effectiveRate).toFixed(2));

      dailyForecasts.push({
        date: dateStr,
        dayName,
        isWeekend,
        predictedKWh,
        lowerBoundKWh,
        upperBoundKWh,
        predictedCostINR,
      });
    }

    const totalPredictedKWh = Number(
      dailyForecasts.reduce((sum, d) => sum + d.predictedKWh, 0).toFixed(2)
    );
    const avgDailyPredictedKWh = Number((totalPredictedKWh / periodDays).toFixed(2));

    // Bill calculation for projected period
    const projectedBill = calculateElectricityBill(totalPredictedKWh, tariffSettings, periodDays);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (trendFactor > 0.005) trend = 'increasing';
    else if (trendFactor < -0.005) trend = 'decreasing';

    const confidencePercentage = isFallback ? 55 : Math.max(70, Math.min(94, 95 - periodDays * 0.5));

    return {
      periodDays,
      totalPredictedKWh,
      totalPredictedCostINR: projectedBill.totalBillINR,
      avgDailyPredictedKWh,
      trend,
      confidencePercentage,
      dailyForecasts,
      generationTimestamp: new Date().toISOString(),
      dataCoverageDays,
      methodology: isFallback
        ? 'Fallback Benchmark Baseline (Insufficient history < 3 days)'
        : '7-Day Rolling Moving Average with Day-of-Week Stratification and Bounded Linear Trend Adjustment',
      assumptions: [
        'Occupancy patterns and appliance inventory remain comparable to the observed historical window.',
        'Slab electricity tariffs and fixed charges remain static across the forecasted timeframe.',
        'Weather patterns do not experience extreme unseasonal heatwaves or sudden cold snaps.',
      ],
      limitations: [
        'This is a mathematical time-series projection, not a physical machine-learning thermal simulation.',
        'Forecast uncertainty interval broadens with longer prediction horizons (e.g. 30 days vs 7 days).',
      ],
    };
  }
}

export const predictionService = new PredictionService();
