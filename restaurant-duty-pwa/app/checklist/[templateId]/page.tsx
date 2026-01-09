/**
 * Checklist Page - Collaborative Task Completion
 *
 * Multiple staff members work on the same checklist.
 * Each task tracks who completed it.
 *
 * Flow:
 * 1. Load checklist (new or resume existing)
 * 2. Display all tasks grouped by section
 * 3. Staff mark tasks as done and enter their name
 * 4. When all done, submit for manager approval
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getTemplate } from '@/lib/constants/templates';
import { useStaffRegistry } from '@/hooks/useStaffRegistry';
import { TaskItem } from '@/components/checklist/TaskItem';
import type { TemplateId, TaskCompletionStatus } from '@/types';

export default function ChecklistPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const templateId = params.templateId as TemplateId;
  const resumeId = searchParams.get('resume');

  const template = getTemplate(templateId);
  const { activeStaff, activeManagers } = useStaffRegistry();

  const [checklistId, setChecklistId] = useState<string | null>(resumeId);
  const [tasks, setTasks] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);

  // Calculate progress
  useEffect(() => {
    const completedTasks = Object.values(tasks).filter(
      (t: any) => t.status === 'done'
    ).length;
    const totalTasks = template.totalTasks;
    setProgress(totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
  }, [tasks, template.totalTasks]);

  // Handle task update
  const handleTaskUpdate = (
    taskId: string,
    status: TaskCompletionStatus,
    staffName?: string,
    inputValue?: number
  ) => {
    // Find staff member
    const staff = activeStaff.find((s) => s.name === staffName);

    setTasks((prev) => ({
      ...prev,
      [taskId]: {
        taskId,
        status,
        completedBy: staff
          ? { id: staff.id, name: staff.name, role: staff.role }
          : undefined,
        completedAt: status === 'done' ? new Date().toISOString() : undefined,
        inputValue,
      },
    }));
  };

  // Handle submit for review
  const handleSubmit = async () => {
    // Check if all tasks are complete
    const incompleteTasks = Object.values(tasks).filter(
      (t: any) => t.status === 'not_done'
    ).length;

    if (incompleteTasks > 0) {
      if (
        !confirm(
          `${incompleteTasks} task${incompleteTasks === 1 ? '' : 's'} incomplete. ` +
            `Submit anyway for manager review?`
        )
      ) {
        return;
      }
    }

    // TODO: Implement manager approval flow
    alert('Manager approval flow coming soon! For now, checklist is complete.');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-4 py-4">
          {/* Back button + Title */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100
                       rounded-lg transition-colors touch-manipulation"
              aria-label="Back to home"
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
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
              <p className="text-sm text-gray-500">{template.description}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">{progress}% Complete</span>
              <span className="text-gray-500">
                {Object.values(tasks).filter((t: any) => t.status === 'done').length} /{' '}
                {template.totalTasks} tasks
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: template.accentColor,
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Task list */}
      <main className="px-4 py-6 pb-32">
        {template.sections.map((section) => (
          <div key={section.id} className="mb-8">
            {/* Section header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              <div className="mt-1 h-1 w-16 rounded-full" style={{ backgroundColor: template.accentColor }} />
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {section.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  completion={tasks[task.id]}
                  staffList={[...activeStaff, ...activeManagers]}
                  onUpdate={handleTaskUpdate}
                />
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Footer with submit button */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-shrink-0 px-6 py-3 text-gray-700 font-medium rounded-xl
                     hover:bg-gray-100 transition-colors touch-manipulation"
          >
            Save & Exit
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 px-6 text-white font-semibold rounded-xl
                     shadow-lg transition-all touch-manipulation active:scale-[0.98]"
            style={{ backgroundColor: template.accentColor }}
          >
            {progress === 100 ? 'Submit for Approval' : 'Save Progress'}
          </button>
        </div>
      </footer>
    </div>
  );
}
