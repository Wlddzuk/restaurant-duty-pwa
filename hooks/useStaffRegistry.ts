/**
 * useStaffRegistry Hook
 * 
 * Manages staff and manager records in IndexedDB.
 * 
 * Key features:
 * - Soft delete (deactivate) to preserve historical data
 * - Manager PIN setup during creation
 * - Filter by role and active status
 * - Audit logging for all changes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, logAuditEntry } from '@/lib/db';
import { setupManagerPin } from '@/lib/utils/pinSecurity';
import type {
  StaffMember,
  Manager,
  CreateStaffInput,
  UpdateStaffInput,
  StaffRole,
} from '@/types';

interface UseStaffRegistryReturn {
  /** All active staff members */
  activeStaff: StaffMember[];
  
  /** All active managers */
  activeManagers: Manager[];
  
  /** All staff (including deactivated) */
  allStaff: StaffMember[];
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Add a new staff member */
  addStaff: (input: CreateStaffInput, addedBy?: string) => Promise<StaffMember | null>;
  
  /** Update staff member */
  updateStaff: (id: string, input: UpdateStaffInput) => Promise<boolean>;
  
  /** Deactivate staff member (soft delete) */
  deactivateStaff: (id: string, deactivatedBy: string) => Promise<boolean>;
  
  /** Reactivate staff member */
  reactivateStaff: (id: string) => Promise<boolean>;
  
  /** Get staff by ID */
  getStaffById: (id: string) => Promise<StaffMember | undefined>;
  
  /** Check if name already exists */
  nameExists: (name: string) => boolean;
  
  /** Refresh data from database */
  refresh: () => void;
}

export function useStaffRegistry(): UseStaffRegistryReturn {
  const [error, setError] = useState<string | null>(null);
  
  // Live query for all staff - updates automatically when data changes
  const allStaff = useLiveQuery(
    async () => {
      return await db.staff.toArray();
    },
    [],
    [] // Default to empty array while loading
  );
  
  // Derived: active staff only
  const activeStaff = allStaff.filter((s) => s.active);
  
  // Derived: active managers only
  const activeManagers = allStaff.filter(
    (s): s is Manager => s.role === 'manager' && s.active
  );
  
  // Check if name exists (case-insensitive)
  const nameExists = useCallback(
    (name: string): boolean => {
      const normalizedName = name.trim().toLowerCase();
      return allStaff.some(
        (s) => s.name.toLowerCase() === normalizedName
      );
    },
    [allStaff]
  );
  
  // Add new staff member
  const addStaff = useCallback(
    async (
      input: CreateStaffInput,
      addedBy?: string
    ): Promise<StaffMember | null> => {
      try {
        setError(null);
        
        // Validate name
        const name = input.name.trim();
        if (!name) {
          setError('Name is required');
          return null;
        }
        
        // Check for duplicate
        if (nameExists(name)) {
          setError('A staff member with this name already exists');
          return null;
        }
        
        // Validate PIN for managers
        if (input.role === 'manager' && !input.pin) {
          setError('PIN is required for managers');
          return null;
        }
        
        if (input.pin && !/^\d{4}$/.test(input.pin)) {
          setError('PIN must be exactly 4 digits');
          return null;
        }
        
        // Create staff record
        const now = new Date().toISOString();
        const id = crypto.randomUUID();
        
        const staffMember: StaffMember | Manager = {
          id,
          name,
          role: input.role,
          active: true,
          createdAt: now,
          addedBy,
          // Manager-specific fields
          ...(input.role === 'manager' && {
            pinHash: '', // Will be set below
            failedAttempts: 0,
          }),
        };
        
        // Save to database
        await db.staff.add(staffMember);
        
        // Set up PIN for managers
        if (input.role === 'manager' && input.pin) {
          await setupManagerPin(id, input.pin);
        }
        
        // Log audit entry
        await logAuditEntry({
          action: input.role === 'manager' ? 'manager_added' : 'staff_added',
          entityId: id,
          entityType: 'staff',
          performedBy: addedBy,
          details: { name, role: input.role },
        });
        
        return staffMember;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add staff';
        setError(message);
        return null;
      }
    },
    [nameExists]
  );
  
  // Update staff member
  const updateStaff = useCallback(
    async (id: string, input: UpdateStaffInput): Promise<boolean> => {
      try {
        setError(null);
        
        // Validate name if provided
        if (input.name !== undefined) {
          const name = input.name.trim();
          if (!name) {
            setError('Name cannot be empty');
            return false;
          }
          
          // Check for duplicate (excluding self)
          const existing = allStaff.find(
            (s) => s.name.toLowerCase() === name.toLowerCase() && s.id !== id
          );
          if (existing) {
            setError('A staff member with this name already exists');
            return false;
          }
          
          input.name = name;
        }
        
        await db.staff.update(id, input);
        
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update staff';
        setError(message);
        return false;
      }
    },
    [allStaff]
  );
  
  // Deactivate staff member (soft delete)
  const deactivateStaff = useCallback(
    async (id: string, deactivatedBy: string): Promise<boolean> => {
      try {
        setError(null);
        
        const staff = await db.staff.get(id);
        if (!staff) {
          setError('Staff member not found');
          return false;
        }
        
        await db.staff.update(id, {
          active: false,
          deactivatedAt: new Date().toISOString(),
          deactivatedBy,
        });
        
        // Log audit entry
        await logAuditEntry({
          action: 'staff_deactivated',
          entityId: id,
          entityType: 'staff',
          performedBy: deactivatedBy,
          details: { name: staff.name },
        });
        
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to deactivate staff';
        setError(message);
        return false;
      }
    },
    []
  );
  
  // Reactivate staff member
  const reactivateStaff = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const staff = await db.staff.get(id);
      if (!staff) {
        setError('Staff member not found');
        return false;
      }
      
      await db.staff.update(id, {
        active: true,
        deactivatedAt: undefined,
        deactivatedBy: undefined,
      });
      
      // Log audit entry
      await logAuditEntry({
        action: 'staff_reactivated',
        entityId: id,
        entityType: 'staff',
        details: { name: staff.name },
      });
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reactivate staff';
      setError(message);
      return false;
    }
  }, []);
  
  // Get staff by ID
  const getStaffById = useCallback(
    async (id: string): Promise<StaffMember | undefined> => {
      return await db.staff.get(id);
    },
    []
  );
  
  // Refresh (noop since we use live query, but provided for API consistency)
  const refresh = useCallback(() => {
    // Live query automatically refreshes
  }, []);
  
  return {
    activeStaff,
    activeManagers,
    allStaff,
    isLoading: allStaff === undefined,
    error,
    addStaff,
    updateStaff,
    deactivateStaff,
    reactivateStaff,
    getStaffById,
    nameExists,
    refresh,
  };
}

export default useStaffRegistry;
