/**
 * Checklist Page
 *
 * Displays the checklist tasks in a table format similar to paper forms.
 * Supports per-task staff signatures and auto-save.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';

// Polyfill for crypto.randomUUID (not available on older Safari/iOS)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
import { getTemplate } from '@/lib/constants/templates';
import { useSessionStore } from '@/lib/stores/useSessionStore';
import { useStaffRegistry } from '@/hooks/useStaffRegistry';
import { db, getDeviceId } from '@/lib/db';
import { verifyManagerPin } from '@/lib/utils/pinSecurity';
import ManagerAuthModal from '@/components/modals/ManagerAuthModal';
import SectionHeader from '@/components/ui/SectionHeader';
import TaskRow from '@/components/ui/TaskRow';
import type {
  DutyTemplate,
  TemplateId,
  ChecklistInstance,
  TaskCompletionStatus,
} from '@/types';

export default function ChecklistPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const templateId = params.templateId as TemplateId;
  const resumeId = searchParams.get('resume');

  const [template, setTemplate] = useState<DutyTemplate | null>(null);
  const [checklist, setChecklist] = useState<ChecklistInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showManagerAuth, setShowManagerAuth] = useState(false);
  const [completedByName, setCompletedByName] = useState(''); // For single-staff templates like pass_opening

  const { activeStaff, activeManagers } = useStaffRegistry();
  const { updateTask } = useSessionStore();

  // Load template and checklist
  useEffect(() => {
    const loadData = async () => {
      try {
        // Ensure database is open
        if (!db.isOpen()) {
          await db.open();
        }

        // Load template
        const tmpl = getTemplate(templateId);
        if (!tmpl) {
          setError('Template not found');
          return;
        }
        setTemplate(tmpl);

        // Load or create checklist
        if (resumeId) {
          // Resume existing checklist
          const existing = await db.checklists.get(resumeId);
          if (existing) {
            setChecklist(existing);
          } else {
            setError('Checklist not found');
          }
        } else {
          // Check for existing in-progress checklist for this template
          const existingChecklists = await db.checklists
            .where('templateId')
            .equals(templateId)
            .filter((c) => c.status === 'in_progress')
            .toArray();

          if (existingChecklists.length > 0) {
            // Use the most recent one
            const mostRecent = existingChecklists.sort(
              (a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime()
            )[0];
            setChecklist(mostRecent);
          } else {
            // Create new checklist
            const deviceId = await getDeviceId();
            const taskIds = tmpl.sections.flatMap((s) => s.tasks.map((t) => t.id));
            const now = new Date().toISOString();

            const newChecklist: ChecklistInstance = {
              id: generateUUID(),
              templateId,
              templateName: tmpl.name,
              status: 'in_progress',
              staff: { id: 'anonymous', name: 'Staff', role: 'staff' },
              deviceId,
              tasks: Object.fromEntries(
                taskIds.map((id) => [id, { taskId: id, status: 'not_done' as TaskCompletionStatus }])
              ),
              completionPercentage: 0,
              doneCount: 0,
              notDoneCount: taskIds.length,
              naCount: 0,
              totalTasks: tmpl.totalTasks,
              startedAt: now,
              lastModifiedAt: now,
            };

            await db.checklists.put(newChecklist);
            setChecklist(newChecklist);
          }
        }
      } catch (err) {
        console.error('Failed to load checklist:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to load checklist: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [templateId, resumeId]);

  // Auto-save periodically
  useEffect(() => {
    if (!checklist) return;

    const interval = setInterval(async () => {
      try {
        await db.checklists.put({
          ...checklist,
          lastModifiedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [checklist]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (checklist) {
        try {
          await db.checklists.put({
            ...checklist,
            lastModifiedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Save on unload failed:', err);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [checklist]);

  // Handle task update
  const handleTaskUpdate = useCallback(
    async (taskId: string, status: TaskCompletionStatus, staffName?: string) => {
      if (!checklist) return;

      const now = new Date().toISOString();
      const updatedTasks = {
        ...checklist.tasks,
        [taskId]: {
          taskId,
          status,
          completedAt: now,
          completedByName: staffName,
        },
      };

      // Calculate new stats
      let doneCount = 0;
      let notDoneCount = 0;
      let naCount = 0;

      Object.values(updatedTasks).forEach((task) => {
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

      const applicableTasks = checklist.totalTasks - naCount;
      const completionPercentage =
        applicableTasks > 0 ? Math.round((doneCount / applicableTasks) * 100) : 100;

      const updatedChecklist: ChecklistInstance = {
        ...checklist,
        tasks: updatedTasks,
        doneCount,
        notDoneCount,
        naCount,
        completionPercentage,
        lastModifiedAt: now,
      };

      // Save to IndexedDB
      await db.checklists.put(updatedChecklist);
      setChecklist(updatedChecklist);
    },
    [checklist]
  );

  // Handle back navigation
  const handleBack = async () => {
    // Save before leaving
    if (checklist) {
      try {
        await db.checklists.put({
          ...checklist,
          lastModifiedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Save on back failed:', err);
      }
    }
    router.push('/');
  };

  // Handle submit for review
  const handleSubmit = () => {
    setShowManagerAuth(true);
  };

  // Handle manager approval
  const handleManagerApprove = async (manager: { id: string; name: string }, shiftNotes?: string) => {
    if (!checklist) return;

    const now = new Date().toISOString();
    const updatedChecklist: ChecklistInstance = {
      ...checklist,
      status: 'approved',
      manager: { id: manager.id, name: manager.name, role: 'manager' },
      approvedAt: now,
      shiftNotes,
      lastModifiedAt: now,
    };

    await db.checklists.put(updatedChecklist);
    setChecklist(updatedChecklist);
    setShowManagerAuth(false);
    router.push('/');
  };

  // Calculate section progress
  const getSectionProgress = (sectionId: string) => {
    if (!template || !checklist) return { done: 0, total: 0 };

    const section = template.sections.find((s) => s.id === sectionId);
    if (!section) return { done: 0, total: 0 };

    let done = 0;
    section.tasks.forEach((task) => {
      const completion = checklist.tasks[task.id];
      if (completion?.status === 'done' || completion?.status === 'na') {
        done++;
      }
    });

    return { done, total: section.tasks.length };
  };

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading checklist...</div>
      </div>
    );
  }

  if (error || !template || !checklist) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="text-red-500">{error || 'Something went wrong'}</div>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700"
        >
          Back to Templates
        </button>
      </div>
    );
  }

  const isComplete = checklist.completionPercentage === 100;
  const isApproved = checklist.status === 'approved';
  const isSingleStaffTemplate = templateId === 'pass_opening'; // Only one person does this checklist

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg touch-manipulation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{template.name}</h1>
              <p className="text-sm text-gray-500">
                {checklist.completionPercentage}% complete ({checklist.doneCount}/{checklist.totalTasks - checklist.naCount} tasks)
              </p>
            </div>
          </div>

          {isApproved && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              Approved
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${checklist.completionPercentage}%` }}
          />
        </div>
      </header>

      {/* Sections and tasks */}
      <main className="flex-1 pb-32">
        {template.sections.map((section) => {
          const progress = getSectionProgress(section.id);

          return (
            <div key={section.id} className="mb-2">
              <SectionHeader
                title={section.title}
                doneCount={progress.done}
                totalCount={progress.total}
              />

              <div className="bg-white">
                {section.tasks.map((task) => {
                  const completion = checklist.tasks[task.id];

                  return (
                    <TaskRow
                      key={task.id}
                      task={task}
                      status={completion?.status || 'not_done'}
                      staffName={isSingleStaffTemplate ? undefined : completion?.completedByName}
                      staffList={activeStaff}
                      onStatusChange={(status) => handleTaskUpdate(task.id, status, isSingleStaffTemplate ? undefined : completion?.completedByName)}
                      onStaffNameChange={isSingleStaffTemplate ? undefined : (name) => handleTaskUpdate(task.id, completion?.status || 'not_done', name)}
                      disabled={isApproved}
                      hideStaffName={isSingleStaffTemplate}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer with submit button */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-inset">
        {!isApproved && (
          <>
            {/* Single staff name input for pass_opening */}
            {isSingleStaffTemplate && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completed by:
                </label>
                <input
                  type="text"
                  value={completedByName}
                  onChange={(e) => setCompletedByName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>
            )}

            <p className="text-xs text-gray-500 text-center mb-3">
              PLEASE NOTE THAT YOU ARE NOT FINISHED UNTIL THESE DUTIES HAVE BEEN CHECKED BY A MANAGER!
            </p>

            <button
              onClick={handleSubmit}
              disabled={!isComplete || (isSingleStaffTemplate && !completedByName.trim())}
              className={`w-full py-3 rounded-lg font-medium transition-colors touch-manipulation ${
                isComplete && (!isSingleStaffTemplate || completedByName.trim())
                  ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {!isComplete
                ? `Complete all tasks to submit (${checklist.completionPercentage}%)`
                : isSingleStaffTemplate && !completedByName.trim()
                  ? 'Enter your name to submit'
                  : 'Submit for Manager Review'
              }
            </button>
          </>
        )}

        {isApproved && (
          <div className="text-center">
            <p className="text-green-600 font-medium">
              Approved by {checklist.manager?.name} at{' '}
              {checklist.approvedAt && new Date(checklist.approvedAt).toLocaleTimeString()}
            </p>
            {checklist.shiftNotes && (
              <p className="text-sm text-gray-600 mt-1">Notes: {checklist.shiftNotes}</p>
            )}
          </div>
        )}
      </footer>

      {/* Manager auth modal */}
      {showManagerAuth && (
        <ManagerAuthModal
          isOpen={showManagerAuth}
          onClose={() => setShowManagerAuth(false)}
          onSuccess={handleManagerApprove}
          managers={activeManagers}
          title="Manager Approval Required"
          showShiftNotes={true}
          verifyPin={verifyManagerPin}
        />
      )}
    </div>
  );
}
