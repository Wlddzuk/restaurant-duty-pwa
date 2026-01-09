/**
 * Session Store (Zustand)
 * 
 * Manages the current checklist session state.
 * Persists to IndexedDB via Dexie for offline resilience.
 * 
 * Key responsibilities:
 * - Track current checklist instance
 * - Update task completion status
 * - Calculate progress metrics
 * - Handle device-locked sessions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  ChecklistInstance,
  TaskCompletion,
  TaskCompletionStatus,
  TemplateId,
  StaffReference,
  ActiveSession,
} from '@/types';
import { calculateCompletionStats } from '@/types';
import { db, getDeviceId, logAuditEntry } from '@/lib/db';
import { getTemplate, getAllTaskIds } from '@/lib/constants/templates';

interface SessionState {
  /** Current active checklist instance */
  currentChecklist: ChecklistInstance | null;
  
  /** Whether data is loading */
  isLoading: boolean;
  
  /** Error message if any */
  error: string | null;
  
  /** Active sessions on other devices (for conflict detection) */
  otherDeviceSessions: ActiveSession[];
}

interface SessionActions {
  /** Start a new checklist from template */
  startChecklist: (templateId: TemplateId, staff: StaffReference) => Promise<void>;
  
  /** Resume an existing checklist */
  resumeChecklist: (checklistId: string) => Promise<void>;
  
  /** Update a task's completion status */
  updateTask: (
    taskId: string,
    status: TaskCompletionStatus,
    note?: string,
    inputValue?: number
  ) => Promise<void>;
  
  /** Mark checklist as ready for review */
  submitForReview: () => Promise<void>;
  
  /** Clear current session */
  clearSession: () => void;
  
  /** Check for active sessions on this template */
  checkForActiveSessions: (templateId: TemplateId) => Promise<ActiveSession | null>;
  
  /** Force close another device's session (manager action) */
  forceCloseSession: (
    checklistId: string,
    manager: StaffReference,
    reason: string
  ) => Promise<void>;
  
  /** Load checklist from IndexedDB */
  loadFromDb: (checklistId: string) => Promise<void>;
  
  /** Persist current state to IndexedDB */
  persistToDb: () => Promise<void>;
}

type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentChecklist: null,
      isLoading: false,
      error: null,
      otherDeviceSessions: [],

      // Start a new checklist
      startChecklist: async (templateId, staff) => {
        set({ isLoading: true, error: null });

        try {
          const deviceId = await getDeviceId();
          const template = getTemplate(templateId);
          const taskIds = getAllTaskIds(template);

          // Initialize empty task completions
          const tasks: Record<string, TaskCompletion> = {};
          taskIds.forEach((id) => {
            tasks[id] = { taskId: id, status: 'done' }; // Default unchecked
            // Actually set to neutral state - we'll use undefined to indicate "not yet interacted"
            tasks[id] = { taskId: id, status: 'done' }; // Will be overridden
          });

          // Create new checklist instance
          const now = new Date().toISOString();
          const checklist: ChecklistInstance = {
            id: crypto.randomUUID(),
            templateId,
            templateName: template.name,
            status: 'in_progress',
            startedBy: staff,
            deviceId,
            tasks: Object.fromEntries(
              taskIds.map((id) => [
                id,
                { taskId: id, status: 'done' as TaskCompletionStatus },
              ])
            ),
            completionPercentage: 0,
            doneCount: 0,
            notDoneCount: 0,
            naCount: 0,
            totalTasks: template.totalTasks,
            startedAt: now,
            lastModifiedAt: now,
          };

          // Reset task states to indicate "unchecked" initially
          // We use 'done' as the target state, so initial should show as needing completion
          checklist.tasks = Object.fromEntries(
            taskIds.map((id) => [id, { taskId: id, status: 'not_done' as TaskCompletionStatus }])
          );
          
          // Recalculate stats
          const stats = calculateCompletionStats(checklist.tasks, checklist.totalTasks);
          checklist.doneCount = stats.doneCount;
          checklist.notDoneCount = stats.notDoneCount;
          checklist.naCount = stats.naCount;
          checklist.completionPercentage = stats.completionPercentage;

          // Save to IndexedDB
          await db.checklists.put(checklist);

          // Log audit entry
          await logAuditEntry({
            action: 'checklist_started',
            entityId: checklist.id,
            entityType: 'checklist',
            performedBy: staff.id,
            details: { templateId, templateName: template.name },
          });

          set({ currentChecklist: checklist, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start checklist',
            isLoading: false,
          });
        }
      },

      // Resume existing checklist
      resumeChecklist: async (checklistId) => {
        set({ isLoading: true, error: null });

        try {
          const checklist = await db.checklists.get(checklistId);

          if (!checklist) {
            throw new Error('Checklist not found');
          }

          const deviceId = await getDeviceId();

          if (checklist.deviceId !== deviceId) {
            throw new Error('This checklist belongs to another device');
          }

          set({ currentChecklist: checklist, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to resume checklist',
            isLoading: false,
          });
        }
      },

      // Update task status
      updateTask: async (taskId, status, note, inputValue) => {
        const { currentChecklist } = get();

        if (!currentChecklist) {
          set({ error: 'No active checklist' });
          return;
        }

        try {
          const now = new Date().toISOString();
          const updatedTask: TaskCompletion = {
            taskId,
            status,
            completedAt: now,
            note,
            inputValue,
            completedBy: currentChecklist.startedBy,
          };

          const updatedTasks = {
            ...currentChecklist.tasks,
            [taskId]: updatedTask,
          };

          // Recalculate stats
          const stats = calculateCompletionStats(updatedTasks, currentChecklist.totalTasks);

          const updatedChecklist: ChecklistInstance = {
            ...currentChecklist,
            tasks: updatedTasks,
            ...stats,
            lastModifiedAt: now,
          };

          // Update IndexedDB
          await db.checklists.put(updatedChecklist);

          set({ currentChecklist: updatedChecklist });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update task',
          });
        }
      },

      // Submit for manager review
      submitForReview: async () => {
        const { currentChecklist } = get();

        if (!currentChecklist) {
          set({ error: 'No active checklist' });
          return;
        }

        try {
          const now = new Date().toISOString();
          const updatedChecklist: ChecklistInstance = {
            ...currentChecklist,
            status: 'pending_review',
            submittedAt: now,
            lastModifiedAt: now,
          };

          await db.checklists.put(updatedChecklist);

          await logAuditEntry({
            action: 'checklist_submitted',
            entityId: currentChecklist.id,
            entityType: 'checklist',
            performedBy: currentChecklist.startedBy.id,
            details: {
              completionPercentage: currentChecklist.completionPercentage,
            },
          });

          set({ currentChecklist: updatedChecklist });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to submit checklist',
          });
        }
      },

      // Clear current session
      clearSession: () => {
        set({ currentChecklist: null, error: null });
      },

      // Check for active sessions on template
      checkForActiveSessions: async (templateId) => {
        try {
          const deviceId = await getDeviceId();

          // Find any in-progress checklists for this template
          const activeSessions = await db.checklists
            .where('templateId')
            .equals(templateId)
            .filter(
              (c) =>
                c.status === 'in_progress' || c.status === 'pending_review'
            )
            .toArray();

          if (activeSessions.length === 0) {
            return null;
          }

          // Return the most recent active session
          const session = activeSessions.sort(
            (a, b) =>
              new Date(b.lastModifiedAt).getTime() -
              new Date(a.lastModifiedAt).getTime()
          )[0];

          return {
            checklistId: session.id,
            templateId: session.templateId,
            templateName: session.templateName,
            staffName: session.startedBy.name,
            deviceId: session.deviceId,
            startedAt: session.startedAt,
            lastActivityAt: session.lastModifiedAt,
            completionPercentage: session.completionPercentage,
            isOwnDevice: session.deviceId === deviceId,
          };
        } catch (error) {
          console.error('Failed to check active sessions:', error);
          return null;
        }
      },

      // Force close session (manager override)
      forceCloseSession: async (checklistId, manager, reason) => {
        try {
          const checklist = await db.checklists.get(checklistId);

          if (!checklist) {
            throw new Error('Checklist not found');
          }

          const now = new Date().toISOString();
          const updatedChecklist: ChecklistInstance = {
            ...checklist,
            status: 'sync_failed', // Mark as failed/closed
            lastModifiedAt: now,
            forceClosedBy: {
              manager,
              reason,
              closedAt: now,
            },
          };

          await db.checklists.put(updatedChecklist);

          await logAuditEntry({
            action: 'session_force_closed',
            entityId: checklistId,
            entityType: 'checklist',
            performedBy: manager.id,
            details: { reason },
          });

          // Clear from current session if it was loaded
          const { currentChecklist } = get();
          if (currentChecklist?.id === checklistId) {
            set({ currentChecklist: null });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to force close session',
          });
        }
      },

      // Load from IndexedDB
      loadFromDb: async (checklistId) => {
        set({ isLoading: true });
        try {
          const checklist = await db.checklists.get(checklistId);
          set({ currentChecklist: checklist || null, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load checklist',
            isLoading: false,
          });
        }
      },

      // Persist to IndexedDB
      persistToDb: async () => {
        const { currentChecklist } = get();
        if (currentChecklist) {
          await db.checklists.put(currentChecklist);
        }
      },
    }),
    { name: 'session-store' }
  )
);

export default useSessionStore;
