/**
 * Checklist Instance Type Definitions
 * 
 * A ChecklistInstance is a specific execution of a DutyTemplate by a staff member.
 * It tracks:
 * - Which template was used
 * - Who is completing it
 * - Status of each task (Done / Not Done / N/A)
 * - Manager authorization and notes
 * - Device binding for session management
 */

import type { TemplateId, RestaurantArea, TimeWindow } from './templates';
import type { StaffReference } from './staff';

/**
 * Possible states for a checklist instance
 */
export type ChecklistStatus = 
  | 'in_progress'    // Staff actively working on it
  | 'pending_review' // Completed, awaiting manager sign-off
  | 'approved'       // Manager approved, ready for sync
  | 'synced'         // Successfully uploaded to Google
  | 'sync_failed';   // Upload failed, will retry

/**
 * Individual task completion state
 */
export type TaskCompletionStatus = 'done' | 'not_done' | 'na';

/**
 * Task completion record with optional notes and input values
 */
export interface TaskCompletion {
  /** Reference to task ID in template */
  taskId: string;

  /** Completion status */
  status: TaskCompletionStatus;

  /** ISO timestamp when status was last changed */
  completedAt?: string;

  /**
   * Manager note if marked as 'not_done'
   * Required when manager overrides with NOT DONE status
   */
  note?: string;

  /**
   * Numeric input value if task requires it
   * (e.g., fridge temperature, stock count)
   */
  inputValue?: number;

  /**
   * Staff member who completed this task
   * Contains full reference (id, name, role) for reporting
   */
  completedBy?: StaffReference;
}

/**
 * Section completion summary
 */
export interface SectionProgress {
  sectionId: string;
  totalTasks: number;
  completedTasks: number;
  notDoneTasks: number;
  naTaskIds: string[];
  percentage: number;
}

/**
 * Main checklist instance - stored in IndexedDB
 *
 * COLLABORATIVE MODEL: Multiple staff members work on the same checklist.
 * Each task tracks who completed it via the completedBy field.
 */
export interface ChecklistInstance {
  /** Unique instance identifier (UUID) */
  id: string;

  /** Which template this is an instance of */
  templateId: TemplateId;

  /** Template name snapshot (for historical accuracy) */
  templateName: string;

  /** Current status of the checklist */
  status: ChecklistStatus;

  /**
   * Staff member who started the checklist (for reference)
   * In collaborative mode, this is just who opened it first
   */
  startedBy: StaffReference;

  /** Manager who authorized (populated on approval) */
  manager?: StaffReference;

  /**
   * All staff members who contributed to this checklist
   * Computed from task completions
   */
  contributors?: StaffReference[];

  /**
   * Device UUID that started this session
   * Multiple devices can work simultaneously
   */
  deviceId: string;

  /** Map of taskId -> completion record */
  tasks: Record<string, TaskCompletion>;

  /** Overall completion percentage (0-100) */
  completionPercentage: number;

  /** Count of tasks marked 'done' */
  doneCount: number;

  /** Count of tasks marked 'not_done' */
  notDoneCount: number;

  /** Count of tasks marked 'na' */
  naCount: number;

  /** Total tasks in template */
  totalTasks: number;

  /** ISO timestamp when checklist was started */
  startedAt: string;

  /** ISO timestamp of last modification */
  lastModifiedAt: string;

  /** ISO timestamp when submitted for review */
  submittedAt?: string;

  /** ISO timestamp when manager approved */
  approvedAt?: string;

  /** ISO timestamp when synced to Google */
  syncedAt?: string;

  /**
   * Manager's overall notes for the shift
   * Free-text field for handoff information
   */
  shiftNotes?: string;

  /**
   * If session was force-closed by manager
   * Contains reason and manager reference
   */
  forceClosedBy?: {
    manager: StaffReference;
    reason: string;
    closedAt: string;
  };
}

/**
 * Data needed to start a new checklist
 */
export interface StartChecklistInput {
  templateId: TemplateId;
  staffId: string;
}

/**
 * Data for manager approval
 */
export interface ApproveChecklistInput {
  checklistId: string;
  managerId: string;
  pin: string;
  shiftNotes?: string;
  /** Task overrides (marking specific tasks as NOT DONE with notes) */
  overrides?: Array<{
    taskId: string;
    status: 'not_done';
    note: string;
  }>;
}

/**
 * Summary for display in lists
 */
export interface ChecklistSummary {
  id: string;
  templateId: TemplateId;
  templateName: string;
  status: ChecklistStatus;
  staffName: string;
  completionPercentage: number;
  startedAt: string;
  lastModifiedAt: string;
}

/**
 * Active session info for device-lock display
 */
export interface ActiveSession {
  checklistId: string;
  templateId: TemplateId;
  templateName: string;
  staffName: string;
  deviceId: string;
  startedAt: string;
  lastActivityAt: string;
  completionPercentage: number;
  /** True if session belongs to current device */
  isOwnDevice: boolean;
}

/**
 * Conflict resolution when another device has active session
 */
export interface SessionConflict {
  existingSession: ActiveSession;
  resolution: 'resume' | 'force_close' | 'cancel';
}

/**
 * Calculate completion stats from tasks map
 */
export function calculateCompletionStats(
  tasks: Record<string, TaskCompletion>,
  totalTasks: number
): {
  doneCount: number;
  notDoneCount: number;
  naCount: number;
  completionPercentage: number;
} {
  let doneCount = 0;
  let notDoneCount = 0;
  let naCount = 0;
  
  Object.values(tasks).forEach(task => {
    switch (task.status) {
      case 'done':
        doneCount++;
        break;
      case 'not_done':
        notDoneCount++;
        break;
      case 'na':
        naCount++;
        break;
    }
  });
  
  // N/A tasks don't count against completion percentage
  const applicableTasks = totalTasks - naCount;
  const completionPercentage = applicableTasks > 0 
    ? Math.round((doneCount / applicableTasks) * 100) 
    : 100;
  
  return { doneCount, notDoneCount, naCount, completionPercentage };
}
