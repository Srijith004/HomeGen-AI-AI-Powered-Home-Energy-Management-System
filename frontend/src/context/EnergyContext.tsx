import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Appliance,
  BillCalculationResult,
  HouseholdProfile,
  OperatingStatus,
  ScenarioComparisonResult,
  StorageSchema,
  SyntheticRecord,
  TariffSettings,
} from '../types';
import { storageService } from '../services/storageService';
import { energyService, GenerationConfig } from '../services/energyService';
import {
  calculateEfficiencyScore,
  calculateElectricityBill,
  calculateEnergySavings,
  calculateTotalPowerDemandKW,
} from '../utils/calculations';

interface EnergyContextType {
  household: HouseholdProfile;
  appliances: Appliance[];
  datasets: SyntheticRecord[];
  tariffSettings: TariffSettings;
  activeScenarioId: string;
  theme: 'dark' | 'light';
  currency: string;
  timeZone: string;
  isGenerating: boolean;
  totalCurrentPowerDemandKW: number;
  currentEfficiencyScore: number;
  currentBill: BillCalculationResult;
  scenarioComparison: ScenarioComparisonResult;
  updateHousehold: (profile: Partial<HouseholdProfile>) => void;
  addAppliance: (appliance: Omit<Appliance, 'id'>) => void;
  updateAppliance: (id: string, updates: Partial<Appliance>) => void;
  deleteAppliance: (id: string) => void;
  toggleApplianceStatus: (id: string) => void;
  setApplianceStatus: (id: string, status: OperatingStatus) => void;
  setFanSpeed: (id: string, speed: number) => void;
  setAcTemp: (id: string, temp: number) => void;
  generateDataset: (config: GenerationConfig) => void;
  clearDataset: () => void;
  updateTariffSettings: (settings: Partial<TariffSettings>) => void;
  applyScenario: (scenarioId: string) => void;
  toggleTheme: () => void;
  exportBackup: () => string;
  importBackup: (jsonStr: string) => { success: boolean; error?: string };
  resetAll: () => void;
}

const EnergyContext = createContext<EnergyContextType | null>(null);

export const EnergyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage
  const [state, setState] = useState<StorageSchema>(() => {
    const loaded = storageService.loadState();
    // If no datasets are generated yet, generate initial 7-day dataset so first load is ready
    if (loaded.datasets.length === 0 && loaded.appliances.length > 0) {
      try {
        const initialData = energyService.generateSyntheticDataset(loaded.appliances, {
          durationDays: 7,
          intervalMinutes: 60,
          seed: 'homegen-initial-demo',
          usageIntensity: 'normal',
          seasonalVariation: true,
          weekdayWeekendVariation: true,
          effectiveTariffRateINR: 4.5,
        });
        loaded.datasets = initialData;
      } catch (e) {
        console.error('Failed to pre-generate initial dataset', e);
      }
    }
    return loaded;
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Sync to storage on change
  useEffect(() => {
    storageService.saveState(state);
  }, [state]);

  // Apply theme class to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (state.preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.preferences.theme]);

  // Total current power demand (kW)
  const totalCurrentPowerDemandKW = useMemo(() => {
    return calculateTotalPowerDemandKW(state.appliances);
  }, [state.appliances]);

  // Total dataset units (kWh)
  const totalDatasetUnitsKWh = useMemo(() => {
    return state.datasets.reduce((sum, r) => sum + r.energyKWh, 0);
  }, [state.datasets]);

  // Distinct days in dataset
  const datasetDaysCount = useMemo(() => {
    const daySet = new Set(state.datasets.map(r => r.timestamp.split('T')[0]));
    return Math.max(1, daySet.size);
  }, [state.datasets]);

  // Current bill calculation
  const currentBill = useMemo(() => {
    return calculateElectricityBill(totalDatasetUnitsKWh, state.tariffSettings, datasetDaysCount);
  }, [totalDatasetUnitsKWh, state.tariffSettings, datasetDaysCount]);

  // Current efficiency score
  const currentEfficiencyScore = useMemo(() => {
    const dailyKWh = currentBill.avgDailyUnitsKWh || 15.0;
    return calculateEfficiencyScore(state.appliances, dailyKWh);
  }, [state.appliances, currentBill.avgDailyUnitsKWh]);

  // Predefined scenario comparison calculations
  const scenarioComparison = useMemo<ScenarioComparisonResult>(() => {
    const effectiveRate = state.tariffSettings.mode === 'flat' ? state.tariffSettings.flatRate : 4.5;
    const baselineDailyKWh = currentBill.avgDailyUnitsKWh > 0 ? currentBill.avgDailyUnitsKWh : 16.5;
    const baselineDailyCostINR = baselineDailyKWh * effectiveRate;

    // In energy saving mode: AC set to 25C (saving ~18%), standby loads eliminated, non-essential lights off
    let savingDailyKWh = baselineDailyKWh * 0.76; // ~24% savings
    if (state.activeScenarioId === 'peak') {
      savingDailyKWh = baselineDailyKWh * 1.45; // peak mode higher
    } else if (state.activeScenarioId === 'vacation') {
      savingDailyKWh = baselineDailyKWh * 0.22; // vacation mode ~78% lower
    }

    const { savedKWh, savingsPercent } = calculateEnergySavings(baselineDailyKWh, savingDailyKWh);
    const scenarioDailyCostINR = savingDailyKWh * effectiveRate;
    const dailyCostSavedINR = Math.max(0, baselineDailyCostINR - scenarioDailyCostINR);

    return {
      scenarioId: state.activeScenarioId,
      scenarioName:
        state.activeScenarioId === 'energy_saving'
          ? 'Energy Saving Mode'
          : state.activeScenarioId === 'peak'
          ? 'Peak Usage Mode'
          : state.activeScenarioId === 'vacation'
          ? 'Vacation Mode'
          : 'Normal Household Usage',
      description:
        state.activeScenarioId === 'energy_saving'
          ? 'Optimized AC setpoints to 24-25°C, eliminated standby drain, and scheduled heavy loads.'
          : state.activeScenarioId === 'peak'
          ? 'Simultaneous operation of cooling, water pumps, entertainment, and kitchen appliances.'
          : state.activeScenarioId === 'vacation'
          ? 'Non-essential circuits isolated; only refrigerator and Wi-Fi security maintain minimal standby.'
          : 'Standard diurnal residential routines with active occupant presence.',
      baselineDailyKWh: Number(baselineDailyKWh.toFixed(2)),
      baselineDailyCostINR: Number(baselineDailyCostINR.toFixed(2)),
      scenarioDailyKWh: Number(savingDailyKWh.toFixed(2)),
      scenarioDailyCostINR: Number(scenarioDailyCostINR.toFixed(2)),
      dailyEnergySavedKWh: savedKWh,
      dailyCostSavedINR: Number(dailyCostSavedINR.toFixed(2)),
      savingsPercentage: savingsPercent,
      monthlyEnergySavedKWh: Number((savedKWh * 30).toFixed(2)),
      monthlyCostSavedINR: Number((dailyCostSavedINR * 30).toFixed(2)),
    };
  }, [currentBill.avgDailyUnitsKWh, state.tariffSettings, state.activeScenarioId]);

  // Actions
  const updateHousehold = useCallback((profile: Partial<HouseholdProfile>) => {
    setState(prev => ({
      ...prev,
      household: { ...prev.household, ...profile },
    }));
  }, []);

  const addAppliance = useCallback((app: Omit<Appliance, 'id'>) => {
    const newApp: Appliance = {
      ...app,
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setState(prev => ({
      ...prev,
      appliances: [...prev.appliances, newApp],
    }));
  }, []);

  const updateAppliance = useCallback((id: string, updates: Partial<Appliance>) => {
    setState(prev => ({
      ...prev,
      appliances: prev.appliances.map(a => (a.id === id ? { ...a, ...updates } : a)),
    }));
  }, []);

  const deleteAppliance = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      appliances: prev.appliances.filter(a => a.id !== id),
    }));
  }, []);

  const toggleApplianceStatus = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      appliances: prev.appliances.map(a => {
        if (a.id !== id) return a;
        const nextStatus: OperatingStatus = a.status === 'ON' ? 'OFF' : 'ON';
        return { ...a, status: nextStatus };
      }),
    }));
  }, []);

  const setApplianceStatus = useCallback((id: string, status: OperatingStatus) => {
    setState(prev => ({
      ...prev,
      appliances: prev.appliances.map(a => (a.id === id ? { ...a, status } : a)),
    }));
  }, []);

  const setFanSpeed = useCallback((id: string, speed: number) => {
    setState(prev => ({
      ...prev,
      appliances: prev.appliances.map(a => {
        if (a.id !== id) return a;
        // Adjust operating power dynamically with fan speed
        const speedRatio = 0.4 + (speed / 5) * 0.6;
        const newOperating = Math.round(a.ratedPowerW * speedRatio);
        return { ...a, fanSpeed: speed, operatingPowerW: newOperating };
      }),
    }));
  }, []);

  const setAcTemp = useCallback((id: string, temp: number) => {
    setState(prev => ({
      ...prev,
      appliances: prev.appliances.map(a => {
        if (a.id !== id) return a;
        // Higher temp draws less power (~6% per degree C)
        const tempMultiplier = 1.0 + (24 - temp) * 0.06;
        const newOperating = Math.round(a.ratedPowerW * 0.8 * tempMultiplier);
        return {
          ...a,
          acTemp: temp,
          operatingPowerW: Math.min(a.ratedPowerW, newOperating),
        };
      }),
    }));
  }, []);

  const generateDataset = useCallback((config: GenerationConfig) => {
    setIsGenerating(true);
    // Allow UI to render loading state before heavy calculation
    setTimeout(() => {
      try {
        const newRecords = energyService.generateSyntheticDataset(state.appliances, config);
        setState(prev => ({
          ...prev,
          datasets: newRecords,
        }));
      } catch (err) {
        console.error('Failed to generate dataset:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  }, [state.appliances]);

  const clearDataset = useCallback(() => {
    setState(prev => ({
      ...prev,
      datasets: [],
    }));
  }, []);

  const updateTariffSettings = useCallback((settings: Partial<TariffSettings>) => {
    setState(prev => ({
      ...prev,
      tariffSettings: { ...prev.tariffSettings, ...settings },
    }));
  }, []);

  const applyScenario = useCallback((scenarioId: string) => {
    setState(prev => {
      let updatedAppliances = [...prev.appliances];

      if (scenarioId === 'energy_saving') {
        // Set ACs to 25C, turn off non-essential lights, turn off standbys
        updatedAppliances = updatedAppliances.map(a => {
          if (a.category === 'Cooling' && a.acTemp) {
            return { ...a, acTemp: 25, operatingPowerW: Math.round(a.ratedPowerW * 0.75) };
          }
          if (a.category === 'Lighting' && a.name.includes('Bedrooms')) {
            return { ...a, status: 'OFF' };
          }
          if (a.category === 'Entertainment' && a.name.includes('Bedroom')) {
            return { ...a, status: 'OFF' };
          }
          return a;
        });
      } else if (scenarioId === 'peak') {
        // Turn on all ACs, TVs, lights, and water heater
        updatedAppliances = updatedAppliances.map(a => {
          if (a.category === 'Cooling') {
            return { ...a, status: 'ON', acTemp: 20, operatingPowerW: a.ratedPowerW };
          }
          if (a.category === 'Lighting' || a.category === 'Entertainment') {
            return { ...a, status: 'ON' };
          }
          return a;
        });
      } else if (scenarioId === 'vacation') {
        // Only keep Fridge and Wi-Fi on
        updatedAppliances = updatedAppliances.map(a => {
          const isEssential =
            a.name.toLowerCase().includes('refrigerator') || a.name.toLowerCase().includes('router');
          return {
            ...a,
            status: isEssential ? 'ON' : 'OFF',
          };
        });
      } else {
        // Normal mode: restore default ON/OFF states
        updatedAppliances = updatedAppliances.map(a => {
          if (a.name.includes('Master') || a.name.includes('Refrigerator') || a.name.includes('Living Room') || a.name.includes('Router') || a.name.includes('Laptop')) {
            return { ...a, status: 'ON' };
          }
          return { ...a, status: 'OFF' };
        });
      }

      return {
        ...prev,
        activeScenarioId: scenarioId,
        appliances: updatedAppliances,
      };
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        theme: prev.preferences.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  }, []);

  const exportBackup = useCallback(() => {
    return storageService.exportBackupJson(state);
  }, [state]);

  const importBackup = useCallback((jsonStr: string) => {
    const res = storageService.importBackupJson(jsonStr);
    if (res.success && res.state) {
      setState(res.state);
      return { success: true };
    }
    return { success: false, error: res.error };
  }, []);

  const resetAll = useCallback(() => {
    const defaults = storageService.resetToDefaults();
    setState(defaults);
  }, []);

  return (
    <EnergyContext.Provider
      value={{
        household: state.household,
        appliances: state.appliances,
        datasets: state.datasets,
        tariffSettings: state.tariffSettings,
        activeScenarioId: state.activeScenarioId,
        theme: state.preferences.theme,
        currency: state.preferences.currency,
        timeZone: state.preferences.timeZone,
        isGenerating,
        totalCurrentPowerDemandKW,
        currentEfficiencyScore,
        currentBill,
        scenarioComparison,
        updateHousehold,
        addAppliance,
        updateAppliance,
        deleteAppliance,
        toggleApplianceStatus,
        setApplianceStatus,
        setFanSpeed,
        setAcTemp,
        generateDataset,
        clearDataset,
        updateTariffSettings,
        applyScenario,
        toggleTheme,
        exportBackup,
        importBackup,
        resetAll,
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = (): EnergyContextType => {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
};
