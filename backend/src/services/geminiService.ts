import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';

export interface ApplianceSummary {
  id: string;
  name: string;
  room: string;
  category: string;
  ratedPowerW: number;
  operatingPowerW: number;
  dailyKWh: number;
  monthlyCostINR: number;
  status: 'ON' | 'OFF' | 'STANDBY';
}

export interface HouseholdContext {
  householdName: string;
  householdProfile: {
    bedrooms: number;
    livingRooms: number;
    kitchens: number;
    bathrooms: number;
    diningAreas: number;
    utilityAreas: number;
  };
  totalCurrentPowerDemandKW: number;
  totalEnergyKWh: number;
  estimatedMonthlyBillINR: number;
  activeAppliancesCount: number;
  appliances: ApplianceSummary[];
  topConsumingAppliances: { name: string; dailyKWh: number; percentage: number }[];
  billingSummary?: {
    mode: 'flat' | 'slab';
    rateOrSlabs: string;
    energyChargeINR: number;
    fixedChargeINR: number;
    totalBillINR: number;
  };
  predictionSummary?: {
    next7DaysKWh: number;
    next15DaysKWh: number;
    next30DaysKWh: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  scenarioComparison?: {
    normalDailyKWh: number;
    savingDailyKWh: number;
    savedKWh: number;
    savingsPercent: number;
  };
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

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (config.geminiApiKey && config.geminiApiKey.trim() !== '') {
      try {
        this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey.trim() });
      } catch (err) {
        console.error('Failed to initialize Google GenAI SDK:', err);
        this.ai = null;
      }
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.ai && config.geminiApiKey && config.geminiApiKey.trim() !== '');
  }

  public async chat(
    message: string,
    context: HouseholdContext,
    history: { role: string; text: string }[] = []
  ): Promise<{ response: string; isFallback: boolean; modelUsed?: string }> {
    if (!this.isConfigured()) {
      return {
        response: this.generateFallbackChatResponse(message, context),
        isFallback: true,
      };
    }

    try {
      const systemPrompt = `You are HomeGen AI, an expert residential electrical energy analyst and smart home advisor.
Analyze the provided simulated household energy data and answer the user's question with actionable, realistic advice.
Important guidelines:
- All data is from an educational simulation of a 3BHK Indian residential household.
- Do not invent non-existent appliance values; use the provided context.
- Keep numbers consistent with the provided data in ₹ and kWh.
- Use clear bullet points, formatting, and prioritized actions.
- Identify uncertainties and assumptions where applicable.

Context data:
${JSON.stringify(context, null, 2)}`;

      const formattedPrompt = `${systemPrompt}\n\nUser Question: ${message}`;
      const response = await this.ai!.models.generateContent({
        model: config.geminiModel,
        contents: formattedPrompt,
      });

      return {
        response: response.text || 'No response generated from Gemini.',
        isFallback: false,
        modelUsed: config.geminiModel,
      };
    } catch (err: any) {
      console.warn('Gemini chat error, reverting to rule-based fallback:', err?.message || err);
      return {
        response: `[Local Rule-Based Energy Advisor] (Gemini API unavailable: ${err?.message || 'Error communicating with Gemini'})\n\n${this.generateFallbackChatResponse(message, context)}`,
        isFallback: true,
      };
    }
  }

  public async getInsights(
    context: HouseholdContext
  ): Promise<{ recommendations: Recommendation[]; isFallback: boolean; modelUsed?: string }> {
    if (!this.isConfigured()) {
      return {
        recommendations: this.generateFallbackRecommendations(context),
        isFallback: true,
      };
    }

    try {
      const prompt = `You are HomeGen AI. Analyze the simulated household energy context and return ONLY a valid JSON array of recommendations.
Context:
${JSON.stringify(context, null, 2)}

Format your response strictly as a JSON array matching this schema:
[
  {
    "id": "rec-1",
    "title": "Title of recommendation",
    "explanation": "Detailed explanation with reasons based on the data",
    "priority": "High" | "Medium" | "Low",
    "relevantAppliance": "Appliance Name",
    "suggestedAction": "Specific user action",
    "estimatedSavingsKWh": 2.5,
    "estimatedSavingsINR": 15.0
  }
]
Output ONLY the JSON array without any markdown formatting or surrounding code blocks.`;

      const response = await this.ai!.models.generateContent({
        model: config.geminiModel,
        contents: prompt,
      });

      const rawText = response.text || '';
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          recommendations: parsed,
          isFallback: false,
          modelUsed: config.geminiModel,
        };
      }
      throw new Error('Invalid JSON format returned from model');
    } catch (err: any) {
      console.warn('Gemini insights error, using fallback:', err?.message || err);
      return {
        recommendations: this.generateFallbackRecommendations(context),
        isFallback: true,
      };
    }
  }

  public async generateReport(
    context: HouseholdContext,
    period: string
  ): Promise<{
    executiveSummary: string;
    keyObservations: string[];
    recommendations: string[];
    riskOrAnomalies: string[];
    isFallback: boolean;
    modelUsed?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        ...this.generateFallbackReport(context, period),
        isFallback: true,
      };
    }

    try {
      const prompt = `Generate an intelligent Home Energy Management Audit Report for period "${period}".
Context:
${JSON.stringify(context, null, 2)}

Respond ONLY with a valid JSON object matching:
{
  "executiveSummary": "Concise high-level summary of consumption and costs",
  "keyObservations": ["Observation 1", "Observation 2", "Observation 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "riskOrAnomalies": ["Potential anomaly or peak demand risk 1"]
}
Output strictly valid JSON without markdown wrapping.`;

      const response = await this.ai!.models.generateContent({
        model: config.geminiModel,
        contents: prompt,
      });

      const rawText = response.text || '';
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        executiveSummary: parsed.executiveSummary || 'Audit report generated successfully.',
        keyObservations: parsed.keyObservations || [],
        recommendations: parsed.recommendations || [],
        riskOrAnomalies: parsed.riskOrAnomalies || [],
        isFallback: false,
        modelUsed: config.geminiModel,
      };
    } catch (err: any) {
      console.warn('Gemini report error, using fallback:', err?.message || err);
      return {
        ...this.generateFallbackReport(context, period),
        isFallback: true,
      };
    }
  }

  // Local Rule-Based Fallbacks
  public generateFallbackChatResponse(message: string, context: HouseholdContext): string {
    const q = message.toLowerCase();
    const topApp = context.topConsumingAppliances[0];

    if (q.includes('most') || q.includes('highest') || q.includes('which appliance')) {
      if (topApp) {
        return `Based on your simulated household data, the highest energy-consuming appliance is **${topApp.name}**, contributing **${topApp.dailyKWh.toFixed(2)} kWh/day** (approx. ${topApp.percentage.toFixed(1)}% of total household energy). Running temperature setpoints at 24°C-26°C or reducing unnecessary idle hours will yield immediate bill reductions.`;
      }
      return 'No appliance data is currently active to determine the highest consumer. Please check your appliance inventory or generate a synthetic dataset.';
    }

    if (q.includes('reduce') || q.includes('save') || q.includes('bill') || q.includes('plan')) {
      return `### Energy-Saving Plan for Your Household:
1. **Optimize Air Conditioner Setpoint**: Setting your AC to 24°C rather than 18°C-20°C reduces compressor runtime by up to 24-30%, potentially saving ₹350 - ₹600/month per AC.
2. **Water Heater (Geyser) Management**: Restrict water heater runtime to 20-30 minutes prior to use rather than leaving thermostatic heaters energized.
3. **Standby Power Elimination**: TVs, microwave clocks, and laptop chargers consume standby power. Switching off at wall sockets saves 5-8% overall.
4. **Appliance Schedule Optimization**: Shift high-load items (washing machine, water pump) to non-peak hours.`;
    }

    if (q.includes('compare') || q.includes('scenario')) {
      if (context.scenarioComparison) {
        const sc = context.scenarioComparison;
        return `### Scenario Comparison (Simulated):
- **Normal Household Mode**: ${sc.normalDailyKWh.toFixed(2)} kWh/day
- **Energy Saving Mode**: ${sc.savingDailyKWh.toFixed(2)} kWh/day
- **Net Daily Savings**: ${sc.savedKWh.toFixed(2)} kWh/day (${sc.savingsPercent.toFixed(1)}% reduction)
Implementing scheduled setback and eliminating standby loads achieves these savings without impacting comfort.`;
      }
    }

    if (q.includes('trend') || q.includes('prediction') || q.includes('forecast')) {
      if (context.predictionSummary) {
        const p = context.predictionSummary;
        return `### Energy Consumption Forecast:
- **Next 7 Days**: ${p.next7DaysKWh.toFixed(1)} kWh
- **Next 15 Days**: ${p.next15DaysKWh.toFixed(1)} kWh
- **Next 30 Days**: ${p.next30DaysKWh.toFixed(1)} kWh
The trend is currently projected as **${p.trend}**. Continue monitoring high-load equipment to prevent slab creep into higher tariff tiers.`;
      }
    }

    return `Here is a summary of your simulated household:
- **Total Power Demand**: ${context.totalCurrentPowerDemandKW.toFixed(3)} kW
- **Estimated Monthly Bill**: ₹${context.estimatedMonthlyBillINR.toFixed(2)}
- **Active Appliances**: ${context.activeAppliancesCount} / ${context.appliances.length}
- **Top Consumer**: ${topApp ? `${topApp.name} (${topApp.percentage.toFixed(1)}%)` : 'None'}

To explore deeper optimizations, ask:
- *"Which appliance consumes the most electricity?"*
- *"How can I reduce my electricity bill?"*
- *"Compare my normal and energy-saving scenarios"*`;
  }

  public generateFallbackRecommendations(context: HouseholdContext): Recommendation[] {
    const recs: Recommendation[] = [];
    const coolingApps = context.appliances.filter(a => a.category.toLowerCase() === 'cooling');
    const waterApps = context.appliances.filter(a => a.category.toLowerCase() === 'water systems');

    if (coolingApps.length > 0) {
      recs.push({
        id: 'rec-cooling-setpoint',
        title: 'Optimize Air Conditioner Temperature Setpoint',
        explanation: 'Operating air conditioners at 24°C instead of lower temperature setpoints saves approximately 6% electricity per degree Celsius raised.',
        priority: 'High',
        relevantAppliance: coolingApps[0].name,
        suggestedAction: 'Set thermostat to 24°C and activate eco-mode during sleeping hours.',
        estimatedSavingsKWh: 3.2,
        estimatedSavingsINR: 19.2,
      });
    }

    if (waterApps.length > 0) {
      recs.push({
        id: 'rec-water-heater',
        title: 'Schedule Geyser Runtime to 25 Minutes',
        explanation: 'Water heaters have high thermal standby losses if left on continuously after reaching cutoff temperature.',
        priority: 'Medium',
        relevantAppliance: waterApps[0].name,
        suggestedAction: 'Switch off water heater immediately after heating or install a mechanical timer.',
        estimatedSavingsKWh: 1.8,
        estimatedSavingsINR: 10.8,
      });
    }

    recs.push({
      id: 'rec-standby-elimination',
      title: 'Eliminate Phantom Standby Loads',
      explanation: 'Entertainment and computing electronics consume continuous parasitic standby power for LED clocks, Wi-Fi polling, and remote receivers.',
      priority: 'Low',
      relevantAppliance: 'Television & Entertainment Hub',
      suggestedAction: 'Use master power strips to cut socket power when devices are idle.',
      estimatedSavingsKWh: 0.9,
      estimatedSavingsINR: 5.4,
    });

    return recs;
  }

  public generateFallbackReport(context: HouseholdContext, period: string) {
    const topApp = context.topConsumingAppliances[0];
    return {
      executiveSummary: `Simulation report for ${period}: Total estimated monthly bill is ₹${context.estimatedMonthlyBillINR.toFixed(2)} with current active power demand of ${context.totalCurrentPowerDemandKW.toFixed(2)} kW. ${topApp ? `${topApp.name} represents the primary consumption driver.` : ''}`,
      keyObservations: [
        `Household currently has ${context.activeAppliancesCount} active appliances running simultaneously.`,
        topApp ? `${topApp.name} accounts for ${topApp.percentage.toFixed(1)}% of total household energy.` : 'Appliance consumption is balanced across major categories.',
        `Current monthly projection reaches ${context.totalEnergyKWh.toFixed(1)} kWh under active simulation conditions.`
      ],
      recommendations: [
        'Shift heavy cyclic loads (washing machine, water pump) outside of peak evening hours (6 PM - 10 PM).',
        'Maintain air conditioners at 24°C and utilize ceiling fans to improve perceived temperature cooling.',
        'Implement smart power strips to eradicate parasitic standby drain on computing and AV setups.'
      ],
      riskOrAnomalies: [
        context.totalCurrentPowerDemandKW > 5.0
          ? 'Simultaneous demand exceeds 5.0 kW, risking peak load demand charges or breaker tripping.'
          : 'Power demand is within standard 5kW sanctioned residential load limits.'
      ]
    };
  }
}

export const geminiService = new GeminiService();
