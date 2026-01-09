/**
 * PIN Security Utilities
 * 
 * Handles secure PIN storage and verification for managers.
 * 
 * Security approach:
 * - PINs are never stored in plain text
 * - SHA-256 hash with device-specific salt
 * - Lockout after 3 failed attempts
 * - 5-minute lockout duration
 * 
 * Note: This is CLIENT-SIDE security for a shared iPad.
 * It prevents casual misuse but won't stop a determined attacker
 * with dev tools access. Acceptable for restaurant checklist use case.
 */

import { db, getPinSalt } from '@/lib/db';
import type { Manager, PinVerificationResult } from '@/types';
import { PIN_SECURITY } from '@/types';

/**
 * Hash a PIN with device-specific salt
 * Uses SHA-256 via SubtleCrypto API
 */
export async function hashPin(managerId: string, pin: string): Promise<string> {
  const salt = await getPinSalt();
  const data = `${salt}:${managerId}:${pin}`;
  
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Set up a new PIN for a manager
 */
export async function setupManagerPin(managerId: string, pin: string): Promise<boolean> {
  try {
    // Validate PIN format
    if (!isValidPinFormat(pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }
    
    const hashedPin = await hashPin(managerId, pin);
    
    await db.staff.update(managerId, {
      pinHash: hashedPin,
      failedAttempts: 0,
      lockedUntil: undefined,
    } as Partial<Manager>);
    
    return true;
  } catch (error) {
    console.error('Failed to setup PIN:', error);
    return false;
  }
}

/**
 * Verify a manager's PIN
 */
export async function verifyManagerPin(
  managerId: string,
  pin: string
): Promise<PinVerificationResult> {
  try {
    const manager = await db.staff.get(managerId) as Manager | undefined;
    
    if (!manager || manager.role !== 'manager') {
      return { success: false, error: 'not_found' };
    }
    
    // Check if account is locked
    if (manager.lockedUntil) {
      const lockExpiry = new Date(manager.lockedUntil).getTime();
      const now = Date.now();
      
      if (now < lockExpiry) {
        const remainingSeconds = Math.ceil((lockExpiry - now) / 1000);
        return {
          success: false,
          error: 'account_locked',
          lockoutRemaining: remainingSeconds,
        };
      } else {
        // Lockout expired, reset attempts
        await db.staff.update(managerId, {
          failedAttempts: 0,
          lockedUntil: undefined,
        } as Partial<Manager>);
      }
    }
    
    // Hash the entered PIN and compare
    const hashedPin = await hashPin(managerId, pin);
    
    if (hashedPin === manager.pinHash) {
      // Success - reset failed attempts
      await db.staff.update(managerId, {
        failedAttempts: 0,
        lockedUntil: undefined,
      } as Partial<Manager>);
      
      return { success: true };
    } else {
      // Failed attempt
      const newFailedAttempts = (manager.failedAttempts || 0) + 1;
      const attemptsRemaining = PIN_SECURITY.MAX_ATTEMPTS - newFailedAttempts;
      
      if (newFailedAttempts >= PIN_SECURITY.MAX_ATTEMPTS) {
        // Lock the account
        const lockedUntil = new Date(
          Date.now() + PIN_SECURITY.LOCKOUT_DURATION_MS
        ).toISOString();
        
        await db.staff.update(managerId, {
          failedAttempts: newFailedAttempts,
          lockedUntil,
        } as Partial<Manager>);
        
        return {
          success: false,
          error: 'account_locked',
          lockoutRemaining: Math.ceil(PIN_SECURITY.LOCKOUT_DURATION_MS / 1000),
        };
      } else {
        // Just increment failed attempts
        await db.staff.update(managerId, {
          failedAttempts: newFailedAttempts,
        } as Partial<Manager>);
        
        return {
          success: false,
          error: 'invalid_pin',
          attemptsRemaining,
        };
      }
    }
  } catch (error) {
    console.error('PIN verification error:', error);
    return { success: false, error: 'invalid_pin' };
  }
}

/**
 * Change a manager's PIN (requires current PIN)
 */
export async function changeManagerPin(
  managerId: string,
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  // First verify current PIN
  const verification = await verifyManagerPin(managerId, currentPin);
  
  if (!verification.success) {
    return {
      success: false,
      error: verification.error === 'account_locked'
        ? 'Account is locked. Please wait.'
        : 'Current PIN is incorrect.',
    };
  }
  
  // Validate new PIN format
  if (!isValidPinFormat(newPin)) {
    return { success: false, error: 'New PIN must be exactly 4 digits.' };
  }
  
  // Set new PIN
  const success = await setupManagerPin(managerId, newPin);
  
  return {
    success,
    error: success ? undefined : 'Failed to update PIN.',
  };
}

/**
 * Reset a manager's PIN (admin action, no current PIN required)
 * Should only be called after some other form of verification
 */
export async function resetManagerPin(
  managerId: string,
  newPin: string
): Promise<boolean> {
  try {
    if (!isValidPinFormat(newPin)) {
      return false;
    }
    
    const hashedPin = await hashPin(managerId, newPin);
    
    await db.staff.update(managerId, {
      pinHash: hashedPin,
      failedAttempts: 0,
      lockedUntil: undefined,
    } as Partial<Manager>);
    
    return true;
  } catch (error) {
    console.error('Failed to reset PIN:', error);
    return false;
  }
}

/**
 * Check if a manager account is currently locked
 */
export async function isManagerLocked(managerId: string): Promise<{
  locked: boolean;
  remainingSeconds?: number;
}> {
  try {
    const manager = await db.staff.get(managerId) as Manager | undefined;
    
    if (!manager?.lockedUntil) {
      return { locked: false };
    }
    
    const lockExpiry = new Date(manager.lockedUntil).getTime();
    const now = Date.now();
    
    if (now < lockExpiry) {
      return {
        locked: true,
        remainingSeconds: Math.ceil((lockExpiry - now) / 1000),
      };
    }
    
    return { locked: false };
  } catch (error) {
    return { locked: false };
  }
}

/**
 * Validate PIN format (exactly 4 digits)
 */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Generate a random 4-digit PIN (for suggestions/reset)
 */
export function generateRandomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
