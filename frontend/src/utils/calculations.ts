import { Appliance, BillCalculationResult, TariffSettings } from '../types';

/**
 * Formula A: Energy Consumption
 * E(kWh) = Power (W) × Duration (hours) / 1000
 */
export function calculateEnergyKWh(powerWatts: number, durationHours: number): number {
  if (powerWatts <= 0 || durationHours <= 0) return 0;
  return (powerWatts * durationHours) / 1000;
}

/**
 * Formula B: Power Demand
 * Total Power (kW) = Sum of Operating Power (W) of all currently active/operating appliances / 1000
 */
export function calculateTotalPowerDemandKW(appliances: Appliance[]): number {
  const totalWatts = appliances.reduce((sum, app) => {
    if (!app.isEnabled) return sum;
    if (app.status === 'ON') {
      return sum + app.operatingPowerW * app.quantity;
    }
    if (app.status === 'STANDBY') {
      return sum + app.standbyPowerW * app.quantity;
    }
    return sum;
  }, 0);
  return totalWatts / 1000;
}

/**
 * Formula E & F: Energy Saved and Savings Percentage
 * Energy Saved = Baseline Energy - Optimized Energy
 * Savings % = (Energy Saved / Baseline Energy) * 100
 */
export function calculateEnergySavings(baselineKWh: number, optimizedKWh: number): {
  savedKWh: number;
  savingsPercent: number;
} {
  const savedKWh = Math.max(0, baselineKWh - optimizedKWh);
  const savingsPercent = baselineKWh > 0 ? (savedKWh / baselineKWh) * 100 : 0;
  return {
    savedKWh: Number(savedKWh.toFixed(3)),
    savingsPercent: Number(savingsPercent.toFixed(2)),
  };
}

/**
 * Formula G: Monthly Estimation from Average Daily Consumption
 * Estimated Monthly Consumption = Average Daily Consumption × 30
 */
export function calculateMonthlyProjection(dailyKWh: number): number {
  return dailyKWh * 30;
}

/**
 * Calculate Individual Appliance Monthly Estimated Cost
 * Monthly Appliance Cost = (Power in W × Daily Usage Hours × 30 / 1000) × Tariff Rate
 */
export function calculateApplianceMonthlyCost(
  ratedOrOperatingPowerW: number,
  dailyHours: number,
  quantity: number = 1,
  effectiveRateINR: number = 4.5
): number {
  const monthlyUnits = calculateEnergyKWh(ratedOrOperatingPowerW * quantity, dailyHours * 30);
  return monthlyUnits * effectiveRateINR;
}

/**
 * Calculate Progressive Slab and Flat Electricity Bills
 */
export function calculateElectricityBill(
  totalUnitsKWh: number,
  tariffSettings: TariffSettings,
  daysInPeriod: number = 30
): BillCalculationResult {
  const units = Math.max(0, totalUnitsKWh);
  const avgDailyUnits = daysInPeriod > 0 ? units / daysInPeriod : 0;
  const projectedMonthlyUnits = avgDailyUnits * 30;

  if (tariffSettings.mode === 'flat') {
    const energyCharge = units * tariffSettings.flatRate;
    const fixedCharge = tariffSettings.fixedCharge;
    const additional = tariffSettings.additionalCharge;
    const subtotal = energyCharge + fixedCharge + additional;
    const surcharge = (subtotal * (tariffSettings.surchargeTaxPercent || 0)) / 100;
    const totalBill = subtotal + surcharge;

    const avgDailyCost = daysInPeriod > 0 ? totalBill / daysInPeriod : 0;
    const projectedMonthlyCost = avgDailyCost * 30;

    return {
      mode: 'flat',
      totalUnitsKWh: Number(units.toFixed(2)),
      energyChargeINR: Number(energyCharge.toFixed(2)),
      fixedChargeINR: Number(fixedCharge.toFixed(2)),
      additionalChargesINR: Number(additional.toFixed(2)),
      surchargeINR: Number(surcharge.toFixed(2)),
      totalBillINR: Number(totalBill.toFixed(2)),
      avgDailyUnitsKWh: Number(avgDailyUnits.toFixed(2)),
      avgDailyCostINR: Number(avgDailyCost.toFixed(2)),
      projectedMonthlyUnitsKWh: Number(projectedMonthlyUnits.toFixed(2)),
      projectedMonthlyCostINR: Number(projectedMonthlyCost.toFixed(2)),
    };
  }

  // Progressive Slab Tariff
  let remainingUnits = units;
  let energyCharge = 0;
  const slabBreakdown: Array<{
    slabLabel: string;
    unitsBilled: number;
    rate: number;
    amountINR: number;
  }> = [];

  for (const slab of tariffSettings.slabs) {
    if (remainingUnits <= 0) {
      slabBreakdown.push({
        slabLabel: slab.label,
        unitsBilled: 0,
        rate: slab.rate,
        amountINR: 0,
      });
      continue;
    }

    const slabCapacity = slab.toUnits !== null ? slab.toUnits - slab.fromUnits : Infinity;
    const unitsInThisSlab = Math.min(remainingUnits, slabCapacity);
    const costForSlab = unitsInThisSlab * slab.rate;

    energyCharge += costForSlab;
    remainingUnits -= unitsInThisSlab;

    slabBreakdown.push({
      slabLabel: slab.label,
      unitsBilled: Number(unitsInThisSlab.toFixed(2)),
      rate: slab.rate,
      amountINR: Number(costForSlab.toFixed(2)),
    });
  }

  const fixedCharge = tariffSettings.fixedCharge;
  const additional = tariffSettings.additionalCharge;
  const subtotal = energyCharge + fixedCharge + additional;
  const surcharge = (subtotal * (tariffSettings.surchargeTaxPercent || 0)) / 100;
  const totalBill = subtotal + surcharge;

  const avgDailyCost = daysInPeriod > 0 ? totalBill / daysInPeriod : 0;
  const projectedMonthlyCost = avgDailyCost * 30;

  return {
    mode: 'slab',
    totalUnitsKWh: Number(units.toFixed(2)),
    energyChargeINR: Number(energyCharge.toFixed(2)),
    fixedChargeINR: Number(fixedCharge.toFixed(2)),
    additionalChargesINR: Number(additional.toFixed(2)),
    surchargeINR: Number(surcharge.toFixed(2)),
    totalBillINR: Number(totalBill.toFixed(2)),
    avgDailyUnitsKWh: Number(avgDailyUnits.toFixed(2)),
    avgDailyCostINR: Number(avgDailyCost.toFixed(2)),
    projectedMonthlyUnitsKWh: Number(projectedMonthlyUnits.toFixed(2)),
    projectedMonthlyCostINR: Number(projectedMonthlyCost.toFixed(2)),
    slabBreakdown,
  };
}

/**
 * Calculate Household Energy Efficiency Score (0 to 100)
 * Evaluates:
 * - Peak load safety (max kW under 5kW sanctioned limit)
 * - Cooling temperature setpoint optimization
 * - Standby parasitic load ratio
 * - Daily kWh consumption relative to typical 3BHK benchmark (15 kWh/day)
 */
export function calculateEfficiencyScore(appliances: Appliance[], dailyKWh: number): number {
  let score = 85; // baseline good score

  // 1. Check AC setpoints (penalize aggressively if < 22C, reward 24C+)
  const acs = appliances.filter(a => a.category === 'Cooling' && a.acTemp !== undefined);
  for (const ac of acs) {
    if (ac.acTemp && ac.acTemp < 22) score -= 8;
    else if (ac.acTemp && ac.acTemp >= 24) score += 4;
  }

  // 2. Check current power demand
  const currentKW = calculateTotalPowerDemandKW(appliances);
  if (currentKW > 4.5) score -= 12;
  else if (currentKW < 2.0) score += 5;

  // 3. Check benchmark consumption
  if (dailyKWh > 25) score -= 15;
  else if (dailyKWh > 18) score -= 8;
  else if (dailyKWh > 0 && dailyKWh < 12) score += 8;

  // 4. Standby loads ratio
  const standbyWatts = appliances.reduce(
    (s, a) => (a.status === 'STANDBY' ? s + a.standbyPowerW * a.quantity : s),
    0
  );
  if (standbyWatts > 50) score -= 5;

  return Math.max(35, Math.min(98, Math.round(score)));
}
