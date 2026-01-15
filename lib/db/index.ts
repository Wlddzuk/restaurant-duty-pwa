/**
 * Dexie.js Database Initialization
 * 
 * Central database instance for the Restaurant Duty PWA.
 * All data is stored locally in IndexedDB for offline-first operation.
 */

import Dexie, { type Table } from 'dexie';
import type {
  StaffMember,
  Manager,
  ChecklistInstance,
  PendingSubmission,
  DeviceConfig,
  AppSettings,
  AuditLogEntry,
} from '@/types';
import {
  DB_NAME,
  CURRENT_DB_VERSION,
  DB_SCHEMA_VERSIONS,
} from '@/types';

// Polyfill for crypto.randomUUID (not available on older Safari/iOS)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return generateUUID();
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Restaurant Duty Database Class
 * 
 * Extends Dexie to provide typed table access and 
 * centralized database management.
 */
export class RestaurantDutyDB extends Dexie {
  // Typed table declarations
  staff!: Table<StaffMember | Manager, string>;
  checklists!: Table<ChecklistInstance, string>;
  submissions!: Table<PendingSubmission, string>;
  deviceConfig!: Table<DeviceConfig, string>;
  appSettings!: Table<AppSettings, string>;
  auditLog!: Table<AuditLogEntry, string>;

  constructor() {
    super(DB_NAME);

    // Define schema for current version
    this.version(CURRENT_DB_VERSION).stores(DB_SCHEMA_VERSIONS[1]);
  }
}

/**
 * Singleton database instance
 * Use this throughout the app for all database operations
 */
export const db = new RestaurantDutyDB();

/**
 * Initialize device configuration on first run
 * Generates unique device ID and PIN salt
 */
export async function initializeDeviceConfig(): Promise<DeviceConfig> {
  const existing = await db.deviceConfig.get('device_config');
  
  if (existing) {
    return existing;
  }
  
  const config: DeviceConfig = {
    id: 'device_config',
    deviceId: generateUUID(),
    pinSalt: generateUUID(),
    installedAt: new Date().toISOString(),
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  };
  
  await db.deviceConfig.put(config);
  return config;
}

/**
 * Initialize app settings with defaults
 */
export async function initializeAppSettings(): Promise<AppSettings> {
  const existing = await db.appSettings.get('app_settings');
  
  if (existing) {
    return existing;
  }
  
  const settings: AppSettings = {
    id: 'app_settings',
    restaurantName: 'Restaurant',
    autoSync: true,
    showCelebrations: true,
    hapticFeedback: true,
  };
  
  await db.appSettings.put(settings);
  return settings;
}

/**
 * Get current device ID
 * Initializes config if not present
 */
export async function getDeviceId(): Promise<string> {
  const config = await initializeDeviceConfig();
  return config.deviceId;
}

/**
 * Get PIN salt for hashing
 * Initializes config if not present
 */
export async function getPinSalt(): Promise<string> {
  const config = await initializeDeviceConfig();
  return config.pinSalt;
}

/**
 * Add entry to audit log
 */
export async function logAuditEntry(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'deviceId'>
): Promise<void> {
  const deviceId = await getDeviceId();
  
  await db.auditLog.add({
    ...entry,
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    deviceId,
  });
}

/**
 * Check if database is ready and accessible
 */
export async function isDatabaseReady(): Promise<boolean> {
  try {
    await db.open();
    return db.isOpen();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

/**
 * Clear all data (for testing/reset)
 * WARNING: This will delete all local data!
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
}

/**
 * Export database for backup
 */
export async function exportDatabase(): Promise<Record<string, unknown[]>> {
  const data: Record<string, unknown[]> = {};
  
  for (const table of db.tables) {
    data[table.name] = await table.toArray();
  }
  
  return data;
}

/**
 * Database connection state
 */
export function getDatabaseState(): {
  isOpen: boolean;
  name: string;
  version: number;
  tables: string[];
} {
  return {
    isOpen: db.isOpen(),
    name: db.name,
    version: db.verno,
    tables: db.tables.map(t => t.name),
  };
}
