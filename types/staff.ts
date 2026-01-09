/**
 * Staff & Manager Type Definitions
 * 
 * IMPORTANT: Staff records use soft-delete (active: boolean) to preserve
 * historical data integrity. Deactivated staff remain in all previous logs
 * but are hidden from the autocomplete selection.
 */

export type StaffRole = 'staff' | 'manager';

/**
 * Base staff member - can complete checklists
 */
export interface StaffMember {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Display name for autocomplete and logs */
  name: string;
  
  /** Role determines access level */
  role: StaffRole;
  
  /** 
   * Soft delete flag - false hides from autocomplete but preserves in logs
   * NEVER hard delete staff records to maintain data integrity
   */
  active: boolean;
  
  /** ISO timestamp of record creation */
  createdAt: string;
  
  /** ISO timestamp when deactivated (if applicable) */
  deactivatedAt?: string;
  
  /** ID of manager who added this staff member */
  addedBy?: string;
  
  /** ID of manager who deactivated this staff member */
  deactivatedBy?: string;
}

/**
 * Manager extends StaffMember with PIN authentication
 * PIN is hashed with device-specific salt for security
 */
export interface Manager extends StaffMember {
  role: 'manager';
  
  /** 
   * SHA-256 hash of: `${deviceSalt}:${managerId}:${pin}`
   * Device-specific to prevent hash reuse across devices
   */
  pinHash: string;
  
  /** Number of consecutive failed PIN attempts */
  failedAttempts: number;
  
  /** ISO timestamp when lockout expires (if locked) */
  lockedUntil?: string;
}

/**
 * Lightweight reference used in logs and historical records
 * Captures name at time of action (immutable snapshot)
 */
export interface StaffReference {
  /** Original staff member ID */
  id: string;
  
  /** Name captured at time of reference (won't change if staff renamed) */
  name: string;
  
  /** Role at time of reference */
  role: StaffRole;
}

/**
 * Input for creating a new staff member
 */
export interface CreateStaffInput {
  name: string;
  role: StaffRole;
  /** Required if role is 'manager' */
  pin?: string;
}

/**
 * Input for updating staff member
 */
export interface UpdateStaffInput {
  name?: string;
  active?: boolean;
}

/**
 * PIN verification result
 */
export interface PinVerificationResult {
  success: boolean;
  error?: 'invalid_pin' | 'account_locked' | 'not_found';
  /** Remaining lockout time in seconds */
  lockoutRemaining?: number;
  /** Attempts remaining before lockout */
  attemptsRemaining?: number;
}

/**
 * Constants for PIN security
 */
export const PIN_SECURITY = {
  /** PIN must be exactly 4 digits */
  PIN_LENGTH: 4,
  
  /** Max failed attempts before lockout */
  MAX_ATTEMPTS: 3,
  
  /** Lockout duration in milliseconds (5 minutes) */
  LOCKOUT_DURATION_MS: 5 * 60 * 1000,
} as const;
