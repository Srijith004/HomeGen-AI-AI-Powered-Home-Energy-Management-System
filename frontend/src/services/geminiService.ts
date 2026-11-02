import { Appliance, BillCalculationResult, PredictionResult, ScenarioComparisonResult } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isFallback?: boolean;
  modelUsed?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  explanation: string;
  priority: 'High' | 'Medium' | 'Low';
  relevantAppliance: string;
  suggestedAction: string;
  estimatedSavingsKWh: number;
  estimatedSavingsINR: number;
}

export interface AiAuditReport {
  executiveSummary: string;
  keyObservations: string[];
  recommendations: string[];
  riskOrAnomalies: string[];
  isFallback: boolean;
  modelUsed?: string;
}

export class FrontendGeminiService {
  /**
   * Check if backend and Gemini are available
   */
  public async checkHealth(): Promise<{ configured: boolean; model: string }> {
    try {
      const res = await fetch('/api/ai/health');
      if (!res.ok) throw new Error('Health check failed');
      const data = await res.json();
      return { configured: data.geminiConfigured, model: data.model };
    } catch {
      return { configured: false, model: 'local-fallback' };
    }
  }

  /**
   * Formats structured application context before sending to AI
   */
  public buildContext(
    householdName: string,
    appliances: Appliance[],
    totalPowerDemandKW: number,
    bill: BillCalculationResult,
    prediction?: PredictionResult,
    scenario?: ScenarioComparisonResult
  ) {
    const activeCount = appliances.filter(a => a.status === 'ON' && a.isEnabled).length;
    const effectiveRate = bill.mode === 'flat' ? 5.5 : 4.5;

    // Appliance breakdown
    const appSummaries = appliances.map(a => {
      const dailyKWh = (a.operatingPowerW * a.quantity * a.dailyUsageHours) / 1000;
      return {
        id: a.id,
        name: a.name,
        room: a.room,
        category: a.category,
        ratedPowerW: a.ratedPowerW * a.quantity,
        operatingPowerW: a.status === 'ON' ? a.operatingPowerW * a.quantity : 0,
        dailyKWh: Number(dailyKWh.toFixed(2)),
        monthlyCostINR: Number((dailyKWh * 30 * effectiveRate).toFixed(2)),
        status: a.status,
      };
    });

    const totalEstDailyKWh = appSummaries.reduce((sum, a) => sum + a.dailyKWh, 0);

    const sortedByCons = [...appSummaries].sort((a, b) => b.dailyKWh - a.dailyKWh);
    const topConsumers = sortedByCons.slice(0, 4).map(a => ({
      name: a.name,
      dailyKWh: a.dailyKWh,
      percentage: totalEstDailyKWh > 0 ? Number(((a.dailyKWh / totalEstDailyKWh) * 100).toFixed(1)) : 0,
    }));

    return {
      householdName,
      householdProfile: {
        bedrooms: 3,
        livingRooms: 1,
        kitchens: 1,
        bathrooms: 2,
        diningAreas: 1,
        utilityAreas: 1,
      },
      totalCurrentPowerDemandKW: Number(totalPowerDemandKW.toFixed(3)),
      totalEnergyKWh: bill.projectedMonthlyUnitsKWh,
      estimatedMonthlyBillINR: bill.totalBillINR,
      activeAppliancesCount: activeCount,
      appliances: appSummaries,
      topConsumingAppliances: topConsumers,
      billingSummary: {
        mode: bill.mode,
        rateOrSlabs: bill.mode === 'flat' ? 'Flat rate' : 'Progressive slab tiers',
        energyChargeINR: bill.energyChargeINR,
        fixedChargeINR: bill.fixedChargeINR,
        totalBillINR: bill.totalBillINR,
      },
      predictionSummary: prediction
        ? {
            next7DaysKWh: prediction.totalPredictedKWh,
            next15DaysKWh: Number((prediction.avgDailyPredictedKWh * 15).toFixed(1)),
            next30DaysKWh: Number((prediction.avgDailyPredictedKWh * 30).toFixed(1)),
            trend: prediction.trend,
          }
        : undefined,
      scenarioComparison: scenario
        ? {
            normalDailyKWh: scenario.baselineDailyKWh,
            savingDailyKWh: scenario.scenarioDailyKWh,
            savedKWh: scenario.dailyEnergySavedKWh,
            savingsPercent: scenario.savingsPercentage,
          }
        : undefined,
    };
  }

  /**
   * Send chat query to Gemini AI backend
   */
  public async sendChat(
    message: string,
    context: any,
    history: { role: string; text: string }[] = []
  ): Promise<{ response: string; isFallback: boolean; modelUsed?: string }> {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, history }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn('Backend chat API failed, using client rule-based advisor:', err);
      return {
        response: `[Local Rule-Based Energy Advisor] (Backend API unavailable)\n\nBased on your simulated household data, high energy loads like Air Conditioning and Water Heaters constitute the greatest bill reduction opportunity. Setting your AC thermostat to 24°C and switching off standby loads can save up to 20% on monthly billing.`,
        isFallback: true,
      };
    }
  }

  /**
   * Fetch AI recommendations
   */
  public async getInsights(
    context: any
  ): Promise<{ recommendations: Recommendation[]; isFallback: boolean; modelUsed?: string }> {
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend insights failed, using client fallback recommendations:', err);
      return {
        recommendations: [
          {
            id: 'rec-1',
            title: 'Set Air Conditioner to 24°C Setpoint',
            explanation: 'Running cooling appliances at 24°C reduces continuous compressor draw and prevents slab creep.',
            priority: 'High',
            relevantAppliance: 'Air Conditioner (Master)',
            suggestedAction: 'Increase thermostat setpoint to 24°C in the Smart Home Simulator.',
            estimatedSavingsKWh: 3.5,
            estimatedSavingsINR: 21.0,
          },
          {
            id: 'rec-2',
            title: 'Shift Water Heating to Timed Intervals',
            explanation: 'Water heaters consume 2000W; avoid keeping them on continuous standby cycles.',
            priority: 'Medium',
            relevantAppliance: 'Water Heater (Geyser 1)',
            suggestedAction: 'Limit heating cycle to 25 minutes prior to morning bath.',
            estimatedSavingsKWh: 1.8,
            estimatedSavingsINR: 10.8,
          },
          {
            id: 'rec-3',
            title: 'Eliminate Entertainment Hub Standby Drain',
            explanation: 'TVs and set-top boxes consume parasitic standby wattage 24 hours a day.',
            priority: 'Low',
            relevantAppliance: 'Television (Living Room 55")',
            suggestedAction: 'Switch off wall socket master switch when retiring for the night.',
            estimatedSavingsKWh: 0.8,
            estimatedSavingsINR: 4.8,
          },
        ],
        isFallback: true,
      };
    }
  }

  /**
   * Request structured AI Energy Audit Report
   */
  public async generateReport(
    context: any,
    period: string
  ): Promise<AiAuditReport> {
    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, period }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Backend report failed, using client fallback report:', err);
      return {
        executiveSummary: `Educational Energy Audit (${period}): The simulated household is operating with balanced residential parameters. Key potential for optimization lies in cooling management and high-draw water heating systems.`,
        keyObservations: [
          'Cooling appliances (Air Conditioners & Ceiling Fans) represent over 45% of total household energy usage.',
          'Standby power across entertainment and computing loads accounts for approximately 5-8% of baseline consumption.',
          'Current load demand remains safely within residential standard thresholds.',
        ],
        recommendations: [
          'Maintain cooling setpoints at or above 24°C.',
          'Restrict water heating cycles to scheduled morning hours.',
          'Consider smart plug power strips for idle electronic workstations.',
        ],
        riskOrAnomalies: [
          'Simultaneous operation of both air conditioners alongside water heaters could cause peak demand spikes.',
        ],
        isFallback: true,
      };
    }
  }
}

export const frontendGeminiService = new FrontendGeminiService();
