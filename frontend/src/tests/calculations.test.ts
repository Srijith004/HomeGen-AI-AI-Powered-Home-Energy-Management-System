import { describe, it, expect } from 'vitest';
import {
  calculateEnergyKWh,
  calculateTotalPowerDemandKW,
  calculateElectricityBill,
  calculateEnergySavings,
  calculateApplianceMonthlyCost,
  calculateEfficiencyScore,
} from '../utils/calculations';
import { createMulberry32, hashString } from '../utils/randomGenerator';
import { DEFAULT_APPLIANCES, DEFAULT_TARIFF_SETTINGS } from '../constants/defaultData';
import { energyService } from '../services/energyService';
import { predictionService } from '../services/predictionService';
import { exportService } from '../services/exportService';

describe('HomeGen AI Mathematical Calculation Suite', () => {
  it('A. Energy consumption: E(kWh) = P(W) * t(hours) / 1000', () => {
    // 1500W AC running for 6 hours = 9 kWh
    expect(calculateEnergyKWh(1500, 6)).toBe(9.0);
    // 75W fan running for 10 hours = 0.75 kWh
    expect(calculateEnergyKWh(75, 10)).toBe(0.75);
    // 0 hours or negative should be safe 0
    expect(calculateEnergyKWh(100, 0)).toBe(0);
    expect(calculateEnergyKWh(-50, 5)).toBe(0);
  });

  it('B. Power demand: Total Power (kW) = Sum of Operating Power (W) / 1000', () => {
    const testAppliances = [
      {
        ...DEFAULT_APPLIANCES[0],
        status: 'ON' as const,
        operatingPowerW: 1200,
        quantity: 1,
        isEnabled: true,
      },
      {
        ...DEFAULT_APPLIANCES[1],
        status: 'OFF' as const,
        operatingPowerW: 1200,
        quantity: 1,
        isEnabled: true,
      },
      {
        ...DEFAULT_APPLIANCES[2],
        status: 'STANDBY' as const,
        standbyPowerW: 8,
        quantity: 1,
        isEnabled: true,
      },
    ];
    // 1200W + 0 + 8W = 1208W = 1.208 kW
    const demand = calculateTotalPowerDemandKW(testAppliances);
    expect(demand).toBeCloseTo(1.208, 3);
  });

  it('C. Progressive Slab Tariff vs Flat Tariff', () => {
    // Test progressive slabs:
    // First 100 @ 1.50 = 150
    // Next 100 @ 2.50 = 250
    // Next 100 @ 4.00 = 400
    // Total 300 units = 800 energy charge
    // + Fixed (120) + Additional (40) = 960 subtotal
    // + 5% duty (48) = 1008 total bill
    const slabBill = calculateElectricityBill(300, DEFAULT_TARIFF_SETTINGS, 30);
    expect(slabBill.mode).toBe('slab');
    expect(slabBill.totalUnitsKWh).toBe(300);
    expect(slabBill.energyChargeINR).toBe(800.0);
    expect(slabBill.fixedChargeINR).toBe(120.0);
    expect(slabBill.additionalChargesINR).toBe(40.0);
    expect(slabBill.surchargeINR).toBe(48.0);
    expect(slabBill.totalBillINR).toBe(1008.0);

    // Test Flat mode:
    const flatSettings = {
      ...DEFAULT_TARIFF_SETTINGS,
      mode: 'flat' as const,
      flatRate: 5.0,
      fixedCharge: 100,
      additionalCharge: 20,
      surchargeTaxPercent: 10,
    };
    // 200 units * 5.0 = 1000 + 100 + 20 = 1120 subtotal + 10% (112) = 1232
    const flatBill = calculateElectricityBill(200, flatSettings, 30);
    expect(flatBill.mode).toBe('flat');
    expect(flatBill.energyChargeINR).toBe(1000.0);
    expect(flatBill.totalBillINR).toBe(1232.0);
  });

  it('D. Individual Appliance Cost calculation', () => {
    // 1500W running 4h/day for 30 days @ 4.5 INR/kWh
    // (1500 * 4 * 30 / 1000) * 4.5 = 180 kWh * 4.5 = 810 INR
    const cost = calculateApplianceMonthlyCost(1500, 4, 1, 4.5);
    expect(cost).toBe(810.0);
  });

  it('E & F. Energy savings and savings percentage', () => {
    const { savedKWh, savingsPercent } = calculateEnergySavings(20.0, 15.0);
    expect(savedKWh).toBe(5.0);
    expect(savingsPercent).toBe(25.0);

    // Safe zero handling
    const zeroCase = calculateEnergySavings(0, 0);
    expect(zeroCase.savedKWh).toBe(0);
    expect(zeroCase.savingsPercent).toBe(0);
  });

  it('G. Mulberry32 PRNG reproducibility', () => {
    const prng1 = createMulberry32('homegen-academic-2026');
    const prng2 = createMulberry32('homegen-academic-2026');

    const seq1 = [prng1(), prng1(), prng1(), prng1()];
    const seq2 = [prng2(), prng2(), prng2(), prng2()];

    expect(seq1).toEqual(seq2);
    expect(seq1[0]).toBeGreaterThanOrEqual(0);
    expect(seq1[0]).toBeLessThanOrEqual(1);
  });

  it('H. Synthetic Dataset Generation validation', () => {
    const dataset = energyService.generateSyntheticDataset(DEFAULT_APPLIANCES, {
      durationDays: 7,
      intervalMinutes: 60,
      seed: 'test-seed-123',
      usageIntensity: 'normal',
      seasonalVariation: true,
      weekdayWeekendVariation: true,
    });

    expect(dataset.length).toBeGreaterThan(0);
    // Every record must be valid
    for (const r of dataset.slice(0, 100)) {
      expect(r.energyKWh).toBeGreaterThanOrEqual(0);
      expect(r.operatingPowerW).toBeGreaterThanOrEqual(0);
      expect(r.operatingPowerW).toBeLessThanOrEqual(r.ratedPowerW);
      expect(r.datasetType).toBe('Synthetic');
      expect(new Date(r.timestamp).getTime()).not.toBeNaN();
    }
  });

  it('I. Prediction forecasting validation', () => {
    const mockRecords = energyService.generateSyntheticDataset(DEFAULT_APPLIANCES, {
      durationDays: 7,
      intervalMinutes: 60,
      seed: 'test-seed-forecast',
      usageIntensity: 'normal',
      seasonalVariation: true,
      weekdayWeekendVariation: true,
    });

    const forecast7 = predictionService.generateForecast(mockRecords, 7, DEFAULT_TARIFF_SETTINGS);
    expect(forecast7.periodDays).toBe(7);
    expect(forecast7.dailyForecasts.length).toBe(7);
    expect(forecast7.totalPredictedKWh).toBeGreaterThan(0);
    expect(forecast7.confidencePercentage).toBeGreaterThanOrEqual(50);
    expect(forecast7.confidencePercentage).toBeLessThanOrEqual(95);

    const forecast30 = predictionService.generateForecast(mockRecords, 30, DEFAULT_TARIFF_SETTINGS);
    expect(forecast30.periodDays).toBe(30);
    expect(forecast30.dailyForecasts.length).toBe(30);
  });

  it('J. CSV cell escaping', () => {
    expect(exportService.escapeCell('CleanText')).toBe('CleanText');
    expect(exportService.escapeCell('Text, with comma')).toBe('"Text, with comma"');
    expect(exportService.escapeCell('Text with "quotes"')).toBe('"Text with ""quotes"""');
  });

  it('K. Efficiency score bounds (0-100)', () => {
    const score = calculateEfficiencyScore(DEFAULT_APPLIANCES, 15.0);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
