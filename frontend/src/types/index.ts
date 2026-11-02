export type RoomType =
  | 'Bedroom 1'
  | 'Bedroom 2'
  | 'Bedroom 3'
  | 'Living Room'
  | 'Kitchen'
  | 'Dining Area'
  | 'Bathroom 1'
  | 'Bathroom 2'
  | 'Utility Area';

export type ApplianceCategory =
  | 'Cooling'
  | 'Lighting'
  | 'Kitchen'
  | 'Entertainment'
  | 'Computing'
  | 'Water Systems'
  | 'Other';

export type OperatingStatus = 'ON' | 'OFF' | 'STANDBY';

export interface Appliance {
  id: string;
  name: string;
  category: ApplianceCategory;
  room: RoomType;
  ratedPowerW: number;
  operatingPowerW: number;
  standbyPowerW: number;
  quantity: number;
  status: OperatingStatus;
  dailyUsageHours: number;
  isEnabled: boolean;
  fanSpeed?: number; // 1 - 5
  acTemp?: number; // 16 - 30 C
  scheduleStart?: string; // HH:mm
  scheduleEnd?: string; // HH:mm
  iconName?: string;
}

export interface SyntheticRecord {
  recordId: string;
  timestamp: string; // ISO 8601
  applianceId: string;
  applianceName: string;
  room: string;
  category: ApplianceCategory;
  ratedPowerW: number;
  operatingPowerW: number;
  energyKWh: number;
  operatingStatus: OperatingStatus;
  usageDurationMinutes: number;
  tariffCategory: string;
  estimatedCostINR: number;
  datasetType: 'Synthetic';
}

export interface HouseholdProfile {
  name: string;
  bedrooms: number;
  livingRooms: number;
  kitchens: number;
  bathrooms: number;
  diningAreas: number;
  utilityAreas: number;
}

export interface TariffSlab {
  id: string;
  fromUnits: number;
  toUnits: number | null; // null means above / infinity
  rate: number;
  label: string;
}

export interface TariffSettings {
  mode: 'flat' | 'slab';
  flatRate: number; // ₹ / kWh
  fixedCharge: number; // ₹ per month
  additionalCharge: number; // ₹ per month
  surchargeTaxPercent: number; // e.g. 5%
  slabs: TariffSlab[];
}

export interface BillCalculationResult {
  mode: 'flat' | 'slab';
  totalUnitsKWh: number;
  energyChargeINR: number;
  fixedChargeINR: number;
  additionalChargesINR: number;
  surchargeINR: number;
  totalBillINR: number;
  avgDailyUnitsKWh: number;
  avgDailyCostINR: number;
  projectedMonthlyUnitsKWh: number;
  projectedMonthlyCostINR: number;
  slabBreakdown?: Array<{
    slabLabel: string;
    unitsBilled: number;
    rate: number;
    amountINR: number;
  }>;
}

export interface DailyPrediction {
  date: string;
  dayName: string;
  isWeekend: boolean;
  predictedKWh: number;
  lowerBoundKWh: number;
  upperBoundKWh: number;
  predictedCostINR: number;
}

export interface PredictionResult {
  periodDays: 7 | 15 | 30;
  totalPredictedKWh: number;
  totalPredictedCostINR: number;
  avgDailyPredictedKWh: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidencePercentage: number;
  dailyForecasts: DailyPrediction[];
  generationTimestamp: string;
  dataCoverageDays: number;
  methodology: string;
  assumptions: string[];
  limitations: string[];
}

export interface ScenarioComparisonResult {
  scenarioId: string;
  scenarioName: string;
  description: string;
  baselineDailyKWh: number;
  baselineDailyCostINR: number;
  scenarioDailyKWh: number;
  scenarioDailyCostINR: number;
  dailyEnergySavedKWh: number;
  dailyCostSavedINR: number;
  savingsPercentage: number;
  monthlyEnergySavedKWh: number;
  monthlyCostSavedINR: number;
}

export interface StorageSchema {
  version: number;
  household: HouseholdProfile;
  appliances: Appliance[];
  datasets: SyntheticRecord[];
  tariffSettings: TariffSettings;
  activeScenarioId: string;
  preferences: {
    theme: 'dark' | 'light';
    currency: string;
    timeZone: string;
  };
  lastUpdated: string;
}
