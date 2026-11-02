import { StorageSchema } from '../types';
import { DEFAULT_HOUSEHOLD, DEFAULT_APPLIANCES, DEFAULT_TARIFF_SETTINGS } from '../constants/defaultData';

const STORAGE_KEY = 'homegen_ai_state_v1';
const CURRENT_STORAGE_VERSION = 1;

export class StorageService {
  /**
   * Initializes or loads persisted state from LocalStorage.
   */
  public loadState(): StorageSchema {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.getDefaultState();
      }

      const parsed: StorageSchema = JSON.parse(raw);

      // Validate schema version and required keys
      if (!parsed || typeof parsed !== 'object' || parsed.version !== CURRENT_STORAGE_VERSION) {
        console.warn('Storage schema mismatch or missing, falling back to defaults.');
        return this.getDefaultState();
      }

      // Check essential keys
      if (!Array.isArray(parsed.appliances) || !parsed.household || !parsed.tariffSettings) {
        return this.getDefaultState();
      }

      return parsed;
    } catch (err) {
      console.error('Failed to parse LocalStorage data:', err);
      return this.getDefaultState();
    }
  }

  /**
   * Persists current state to LocalStorage.
   */
  public saveState(state: StorageSchema): void {
    try {
      const updated: StorageSchema = {
        ...state,
        version: CURRENT_STORAGE_VERSION,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save state to LocalStorage:', err);
    }
  }

  /**
   * Generates default initial state.
   */
  public getDefaultState(): StorageSchema {
    return {
      version: CURRENT_STORAGE_VERSION,
      household: DEFAULT_HOUSEHOLD,
      appliances: DEFAULT_APPLIANCES,
      datasets: [],
      tariffSettings: DEFAULT_TARIFF_SETTINGS,
      activeScenarioId: 'normal',
      preferences: {
        theme: 'dark',
        currency: '₹',
        timeZone: 'Asia/Kolkata',
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Exports application state as a JSON string for backup download.
   */
  public exportBackupJson(state: StorageSchema): string {
    return JSON.stringify(state, null, 2);
  }

  /**
   * Validates and imports a JSON backup string.
   */
  public importBackupJson(jsonString: string): { success: boolean; state?: StorageSchema; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Uploaded file is not a valid JSON object.' };
      }

      if (!parsed.household || !Array.isArray(parsed.appliances)) {
        return { success: false, error: 'Invalid backup structure: Missing household or appliances data.' };
      }

      const validState: StorageSchema = {
        version: CURRENT_STORAGE_VERSION,
        household: parsed.household || DEFAULT_HOUSEHOLD,
        appliances: parsed.appliances || DEFAULT_APPLIANCES,
        datasets: Array.isArray(parsed.datasets) ? parsed.datasets : [],
        tariffSettings: parsed.tariffSettings || DEFAULT_TARIFF_SETTINGS,
        activeScenarioId: parsed.activeScenarioId || 'normal',
        preferences: parsed.preferences || {
          theme: 'dark',
          currency: '₹',
          timeZone: 'Asia/Kolkata',
        },
        lastUpdated: new Date().toISOString(),
      };

      this.saveState(validState);
      return { success: true, state: validState };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to parse JSON file.' };
    }
  }

  /**
   * Resets local storage to default configuration.
   */
  public resetToDefaults(): StorageSchema {
    const defaults = this.getDefaultState();
    this.saveState(defaults);
    return defaults;
  }
}

export const storageService = new StorageService();
