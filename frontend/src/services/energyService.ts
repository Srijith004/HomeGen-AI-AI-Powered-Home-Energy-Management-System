import { Appliance, SyntheticRecord } from '../types';
import { createMulberry32 } from '../utils/randomGenerator';
import { calculateEnergyKWh } from '../utils/calculations';

export interface GenerationConfig {
  durationDays: 7 | 30 | 90 | 180 | 365;
  intervalMinutes: 15 | 30 | 60 | 1440; // 1440 = daily
  seed: string | number;
  selectedApplianceIds?: string[];
  usageIntensity: 'low' | 'normal' | 'high';
  seasonalVariation: boolean;
  weekdayWeekendVariation: boolean;
  effectiveTariffRateINR?: number;
}

export class EnergyService {
  /**
   * Generates a realistic synthetic household electricity dataset locally
   * using seeded pseudo-random numbers and diurnal scheduling models.
   */
  public generateSyntheticDataset(
    appliances: Appliance[],
    config: GenerationConfig
  ): SyntheticRecord[] {
    const {
      durationDays = 7,
      intervalMinutes = 60,
      seed = 'homegen-seed-42',
      selectedApplianceIds,
      usageIntensity = 'normal',
      seasonalVariation = true,
      weekdayWeekendVariation = true,
      effectiveTariffRateINR = 4.5,
    } = config;

    const prng = createMulberry32(seed);

    // Filter appliances to include
    const activeAppliances = appliances.filter(app =>
      app.isEnabled && (!selectedApplianceIds || selectedApplianceIds.includes(app.id))
    );

    if (activeAppliances.length === 0) return [];

    const intensityMultiplier =
      usageIntensity === 'low' ? 0.8 : usageIntensity === 'high' ? 1.25 : 1.0;

    const intervalHours = intervalMinutes / 60;
    const records: SyntheticRecord[] = [];

    // Anchor end date at current local date, generate backward so dataset ends at today
    const now = new Date();
    // Round now to end of hour
    now.setMinutes(0, 0, 0);

    const totalIntervals = Math.round((durationDays * 24 * 60) / intervalMinutes);
    const startTimeMs = now.getTime() - durationDays * 24 * 60 * 60 * 1000;

    for (let step = 0; step < totalIntervals; step++) {
      const currentTimestampMs = startTimeMs + step * intervalMinutes * 60 * 1000;
      const currentDate = new Date(currentTimestampMs);
      const hour = currentDate.getHours() + currentDate.getMinutes() / 60;
      const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const month = currentDate.getMonth(); // 0-11

      // Seasonal adjustment (Indian subcontinent: April-June is summer high cooling; Dec-Jan winter)
      let seasonFactor = 1.0;
      if (seasonalVariation) {
        if (month >= 3 && month <= 6) {
          seasonFactor = 1.22; // Hot summer
        } else if (month >= 10 || month <= 1) {
          seasonFactor = 0.88; // Mild winter
        } else {
          seasonFactor = 1.02; // Monsoon/Autumn
        }
      }

      // Weekend adjustment
      const weekendFactor = weekdayWeekendVariation && isWeekend ? 1.15 : 1.0;

      for (const app of activeAppliances) {
        const { status, operatingPowerW, usageMinutes } = this.simulateApplianceInterval(
          app,
          hour,
          isWeekend,
          seasonFactor,
          intensityMultiplier * weekendFactor,
          intervalMinutes,
          prng
        );

        // Cap operating power to rated power
        const safeOperatingPowerW = Math.min(app.ratedPowerW * app.quantity, operatingPowerW);
        const actualOperatingHours = usageMinutes / 60;
        const energyKWh = calculateEnergyKWh(safeOperatingPowerW, actualOperatingHours);
        const estimatedCostINR = energyKWh * effectiveTariffRateINR;

        records.push({
          recordId: `rec-${step}-${app.id}`,
          timestamp: currentDate.toISOString(),
          applianceId: app.id,
          applianceName: app.name,
          room: app.room,
          category: app.category,
          ratedPowerW: app.ratedPowerW * app.quantity,
          operatingPowerW: Number(safeOperatingPowerW.toFixed(1)),
          energyKWh: Number(energyKWh.toFixed(4)),
          operatingStatus: status,
          usageDurationMinutes: usageMinutes,
          tariffCategory: 'Residential-Standard',
          estimatedCostINR: Number(estimatedCostINR.toFixed(2)),
          datasetType: 'Synthetic',
        });
      }
    }

    return records;
  }

  /**
   * Simulates appliance status and power draw during a specific interval.
   */
  private simulateApplianceInterval(
    app: Appliance,
    hour: number,
    isWeekend: boolean,
    seasonFactor: number,
    intensityFactor: number,
    intervalMinutes: number,
    prng: () => number
  ): { status: 'ON' | 'OFF' | 'STANDBY'; operatingPowerW: number; usageMinutes: number } {
    const r = prng();
    const noise = 0.95 + prng() * 0.1; // +/- 5% natural fluctuation

    // REFRIGERATOR: Cycles continuously 24/7 with compressor duty cycle (~35% ON)
    if (app.category === 'Kitchen' && app.name.toLowerCase().includes('refrigerator')) {
      const isCompressorRunning = r < 0.45;
      if (isCompressorRunning) {
        return {
          status: 'ON',
          operatingPowerW: app.operatingPowerW * noise,
          usageMinutes: intervalMinutes,
        };
      }
      return {
        status: 'STANDBY',
        operatingPowerW: app.standbyPowerW || 8,
        usageMinutes: intervalMinutes,
      };
    }

    // AIR CONDITIONER: Operates primarily at night (10 PM - 6 AM) or afternoon (2 PM - 5 PM)
    if (app.category === 'Cooling' && app.name.toLowerCase().includes('air conditioner')) {
      const isNight = hour >= 22 || hour < 6;
      const isAfternoon = hour >= 13 && hour <= 16;
      let probOn = 0.05;
      if (isNight) probOn = 0.85 * seasonFactor * intensityFactor;
      else if (isAfternoon) probOn = (isWeekend ? 0.65 : 0.3) * seasonFactor * intensityFactor;

      if (r < Math.min(0.98, probOn)) {
        // Temperature setpoint effect: 24C is baseline. Lower temp draws more power.
        const setpoint = app.acTemp || 24;
        const tempMultiplier = 1.0 + (24 - setpoint) * 0.06;
        const stagedPower = app.operatingPowerW * tempMultiplier * noise;
        return {
          status: 'ON',
          operatingPowerW: Math.min(app.ratedPowerW, stagedPower),
          usageMinutes: intervalMinutes,
        };
      }
      return {
        status: app.standbyPowerW > 0 ? 'STANDBY' : 'OFF',
        operatingPowerW: app.standbyPowerW || 0,
        usageMinutes: app.standbyPowerW > 0 ? intervalMinutes : 0,
      };
    }

    // CEILING FANS: Operates across night and afternoon
    if (app.category === 'Cooling' && app.name.toLowerCase().includes('fan')) {
      const isSleepingHours = hour >= 22 || hour < 7;
      const isEvening = hour >= 17 && hour < 22;
      let probOn = 0.3;
      if (isSleepingHours) probOn = 0.9 * intensityFactor;
      else if (isEvening) probOn = 0.75 * intensityFactor;
      else if (isWeekend) probOn = 0.6;

      if (r < probOn) {
        // Speed effect: speed 1-5
        const speed = app.fanSpeed || 3;
        const speedRatio = 0.4 + (speed / 5) * 0.6;
        return {
          status: 'ON',
          operatingPowerW: app.ratedPowerW * speedRatio * app.quantity * noise,
          usageMinutes: intervalMinutes,
        };
      }
      return { status: 'OFF', operatingPowerW: 0, usageMinutes: 0 };
    }

    // LIGHTS: Operates primarily between 6:00 PM and 11:30 PM, plus early morning 5:30-7:00 AM
    if (app.category === 'Lighting') {
      const isEvening = hour >= 18 && hour <= 23;
      const isEarlyMorning = hour >= 5.5 && hour <= 7.0;
      let probOn = 0.05;
      if (isEvening) probOn = 0.85 * intensityFactor;
      else if (isEarlyMorning) probOn = 0.45;

      if (r < probOn) {
        return {
          status: 'ON',
          operatingPowerW: app.operatingPowerW * app.quantity * noise,
          usageMinutes: intervalMinutes,
        };
      }
      return { status: 'OFF', operatingPowerW: 0, usageMinutes: 0 };
    }

    // TELEVISION: Evening entertainment 6:30 PM - 11:00 PM + weekend afternoons
    if (app.category === 'Entertainment' && app.name.toLowerCase().includes('television')) {
      const isEvening = hour >= 19 && hour <= 23;
      const isWeekendAfternoon = isWeekend && hour >= 13 && hour <= 17;
      let probOn = 0.08;
      if (isEvening) probOn = 0.8 * intensityFactor;
      else if (isWeekendAfternoon) probOn = 0.55 * intensityFactor;

      if (r < probOn) {
        return {
          status: 'ON',
          operatingPowerW: app.operatingPowerW * noise,
          usageMinutes: intervalMinutes,
        };
      }
      return {
        status: app.standbyPowerW > 0 ? 'STANDBY' : 'OFF',
        operatingPowerW: app.standbyPowerW || 0,
        usageMinutes: app.standbyPowerW > 0 ? intervalMinutes : 0,
      };
    }

    // WATER HEATER (GEYSER): Morning bath spike 6:00 AM - 8:30 AM
    if (app.category === 'Water Systems' && app.name.toLowerCase().includes('heater')) {
      const isMorningSlot = hour >= 6.0 && hour <= 8.5;
      if (isMorningSlot && r < 0.45 * intensityFactor) {
        // High rated power for fraction of interval (e.g. 20-25 mins)
        const runMinutes = Math.min(intervalMinutes, 25);
        return {
          status: 'ON',
          operatingPowerW: app.ratedPowerW * noise,
          usageMinutes: runMinutes,
        };
      }
      return { status: 'OFF', operatingPowerW: 0, usageMinutes: 0 };
    }

    // WATER PUMP: Early morning 6:00 AM - 7:00 AM or evening 5:30 PM - 6:30 PM
    if (app.category === 'Water Systems' && app.name.toLowerCase().includes('pump')) {
      const isPumpingTime = (hour >= 6.0 && hour <= 6.8) || (hour >= 17.5 && hour <= 18.2);
      if (isPumpingTime && r < 0.5) {
        const runMinutes = Math.min(intervalMinutes, 30);
        return {
          status: 'ON',
          operatingPowerW: app.operatingPowerW * noise,
          usageMinutes: runMinutes,
        };
      }
      return { status: 'OFF', operatingPowerW: 0, usageMinutes: 0 };
    }

    // WASHING MACHINE: Morning 9:00 AM - 11:30 AM, especially weekends
    if (app.name.toLowerCase().includes('washing machine')) {
      const isWashSlot = hour >= 9 && hour <= 11.5;
      const probWash = (isWeekend ? 0.45 : 0.15) * intensityFactor;
      if (isWashSlot && r < probWash) {
        return {
          status: 'ON',
          operatingPowerW: app.operatingPowerW * noise,
          usageMinutes: Math.min(intervalMinutes, 45),
        };
      }
      return {
        status: app.standbyPowerW > 0 ? 'STANDBY' : 'OFF',
        operatingPowerW: app.standbyPowerW || 0,
        usageMinutes: app.standbyPowerW > 0 ? intervalMinutes : 0,
      };
    }

    // COOKING (Induction Stove, Microwave, Rice Cooker): Breakfast, Lunch, Dinner
    if (app.category === 'Kitchen') {
      const isMealTime =
        (hour >= 7.5 && hour <= 9.0) || (hour >= 12.0 && hour <= 13.5) || (hour >= 19.5 && hour <= 21.0);
      if (isMealTime && r < 0.35 * intensityFactor) {
        return {
          status: 'ON',
          operatingPowerW: app.operatingPowerW * noise,
          usageMinutes: Math.min(intervalMinutes, 25),
        };
      }
      return {
        status: app.standbyPowerW > 0 ? 'STANDBY' : 'OFF',
        operatingPowerW: app.standbyPowerW || 0,
        usageMinutes: app.standbyPowerW > 0 ? intervalMinutes : 0,
      };
    }

    // COMPUTING (Laptops & Wi-Fi Router): Wi-Fi is 24/7, laptops 9 AM - 6 PM
    if (app.name.toLowerCase().includes('router')) {
      return {
        status: 'ON',
        operatingPowerW: app.operatingPowerW * noise,
        usageMinutes: intervalMinutes,
      };
    }

    if (app.name.toLowerCase().includes('laptop')) {
      const isWorkHours = hour >= 9 && hour <= 18;
      if (isWorkHours && (r < 0.75 || !isWeekend)) {
        return {
          status: 'ON',
          operatingPowerW: app.operatingPowerW * app.quantity * noise,
          usageMinutes: intervalMinutes,
        };
      }
      return {
        status: app.standbyPowerW > 0 ? 'STANDBY' : 'OFF',
        operatingPowerW: (app.standbyPowerW || 0) * app.quantity,
        usageMinutes: intervalMinutes,
      };
    }

    // Generic fallback for any custom appliance
    const probGeneric = (app.dailyUsageHours / 24) * intensityFactor;
    if (r < probGeneric) {
      return {
        status: 'ON',
        operatingPowerW: app.operatingPowerW * app.quantity * noise,
        usageMinutes: intervalMinutes,
      };
    }
    return {
      status: app.standbyPowerW > 0 ? 'STANDBY' : 'OFF',
      operatingPowerW: (app.standbyPowerW || 0) * app.quantity,
      usageMinutes: app.standbyPowerW > 0 ? intervalMinutes : 0,
    };
  }
}

export const energyService = new EnergyService();
