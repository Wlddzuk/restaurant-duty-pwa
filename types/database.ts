/**
 * Database Type Definitions for Dexie.js
 * 
 * Defines the IndexedDB schema and table structures.
 * All app data is persisted locally first, then synced to Google APIs.
 */

import type { Table } from 'dexie';
import type { StaffMember, Manager } from './staff';
import type { ChecklistInstance } from './checklist';
import type { PendingSubmission } from './sync';

/**
 * Device-specific configuration stored locally
 */
export interface DeviceConfig {
  /** Always 'device_config' - singleton record */
  id: 'device_config';
  
  /** Unique device identifier (UUID) - generated on first run */
  deviceId: string;
  
  /** Salt for PIN hashing - unique per device */
  pinSalt: string;
  
  /** ISO timestamp of first app launch */
  installedAt: string;
  
  /** Last known online status */
  lastOnlineAt?: string;
  
  /** App version for migration tracking */
  appVersion: string;
}

/**
 * App settings (user preferences)
 */
export interface AppSettings {
  /** Always 'app_settings' - singleton record */
  id: 'app_settings';
  
  /** Restaurant name for PDF headers */
  restaurantName: string;
  
  /** Google Sheets ID for logging */
  sheetsId?: string;
  
  /** Google Drive root folder ID */
  driveFolderId?: string;
  
  /** Auto-sync when online */
  autoSync: boolean;
  
  /** Show completion celebrations */
  showCelebrations: boolean;
  
  /** Haptic feedback on touch */
  hapticFeedback: boolean;
}

/**
 * Audit log entry for tracking important actions
 */
export interface AuditLogEntry {
  /** Unique entry ID (UUID) */
  id: string;
  
  /** Type of action */
  action: 
    | 'staff_added'
    | 'staff_deactivated'
    | 'staff_reactivated'
    | 'manager_added'
    | 'pin_changed'
    | 'checklist_started'
    | 'checklist_submitted'
    | 'checklist_approved'
    | 'session_force_closed'
    | 'sync_failed'
    | 'sync_completed';
  
  /** ID of entity affected */
  entityId: string;
  
  /** Type of entity */
  entityType: 'staff' | 'checklist' | 'submission';
  
  /** Who performed the action (staff/manager ID) */
  performedBy?: string;
  
  /** Additional context */
  details?: Record<string, unknown>;
  
  /** ISO timestamp */
  timestamp: string;
  
  /** Device ID where action occurred */
  deviceId: string;
}

/**
 * Database table definitions for Dexie
 */
export interface DatabaseTables {
  /** Staff and manager records */
  staff: Table<StaffMember | Manager, string>;
  
  /** Checklist instances */
  checklists: Table<ChecklistInstance, string>;
  
  /** Pending submissions queue */
  submissions: Table<PendingSubmission, string>;
  
  /** Device configuration (singleton) */
  deviceConfig: Table<DeviceConfig, string>;
  
  /** App settings (singleton) */
  appSettings: Table<AppSettings, string>;
  
  /** Audit log */
  auditLog: Table<AuditLogEntry, string>;
}

/**
 * Database schema version history
 * Used for migrations when schema changes
 */
export const DB_SCHEMA_VERSIONS = {
  1: {
    staff: '&id, name, role, active, createdAt',
    checklists: '&id, templateId, status, deviceId, startedAt, [status+deviceId]',
    submissions: '&id, checklistId, status, createdAt, [status+createdAt]',
    deviceConfig: '&id',
    appSettings: '&id',
    auditLog: '&id, action, entityId, timestamp, [action+timestamp]',
  },
} as const;

/**
 * Current schema version
 */
export const CURRENT_DB_VERSION = 1;

/**
 * Database name
 */
export const DB_NAME = 'RestaurantDutyPWA';

/**
 * Index definitions explanation:
 * 
 * staff:
 *   - &id: Primary key (unique)
 *   - name: For autocomplete search
 *   - role: Filter by staff/manager
 *   - active: Filter active members
 *   - createdAt: Sort by join date
 * 
 * checklists:
 *   - &id: Primary key
 *   - templateId: Filter by template type
 *   - status: Filter by completion status
 *   - deviceId: Find sessions for device
 *   - startedAt: Sort by date
 *   - [status+deviceId]: Compound index for "active session on this device"
 * 
 * submissions:
 *   - &id: Primary key (idempotency key)
 *   - checklistId: Link to checklist
 *   - status: Filter pending/failed
 *   - createdAt: Sort for queue processing
 *   - [status+createdAt]: Compound for "oldest pending"
 * 
 * auditLog:
 *   - &id: Primary key
 *   - action: Filter by action type
 *   - entityId: Find logs for entity
 *   - timestamp: Sort chronologically
 *   - [action+timestamp]: Compound for "recent actions of type"
 */
