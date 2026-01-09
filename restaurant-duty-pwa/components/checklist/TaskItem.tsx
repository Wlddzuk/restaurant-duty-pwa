/**
 * TaskItem Component
 *
 * Individual task with:
 * - Checkbox for Done/Not Done/N/A
 * - Staff name input (autocomplete)
 * - Optional numeric input field
 * - Completion status and timestamp
 *
 * COLLABORATIVE MODE: Each task asks "Who completed this?"
 */

'use client';

import { useState } from 'react';
import type { DutyTask, TaskCompletion, TaskCompletionStatus, StaffMember } from '@/types';

interface TaskItemProps {
  task: DutyTask;
  completion?: TaskCompletion;
  staffList: StaffMember[];
  onUpdate: (taskId: string, status: TaskCompletionStatus, staffName?: string, inputValue?: number) => void;
  disabled?: boolean;
}

export function TaskItem({ task, completion, staffList, onUpdate, disabled }: TaskItemProps) {
  const [showStaffInput, setShowStaffInput] = useState(false);
  const [staffSearch, setStaffSearch] = useState(completion?.completedBy?.name || '');
  const [inputValue, setInputValue] = useState<string>(
    completion?.inputValue?.toString() || ''
  );

  const status = completion?.status || 'not_done';
  const completedBy = completion?.completedBy;

  // Handle status toggle
  const handleStatusToggle = () => {
    if (disabled) return;

    // Cycle: not_done → done (with staff input) → na → not_done
    if (status === 'not_done') {
      setShowStaffInput(true);
    } else if (status === 'done') {
      onUpdate(task.id, 'na', undefined, undefined);
    } else {
      onUpdate(task.id, 'not_done', undefined, undefined);
    }
  };

  // Handle staff selection
  const handleStaffSelect = (staff: StaffMember) => {
    const numValue = task.requiresInput && inputValue ? parseFloat(inputValue) : undefined;
    onUpdate(task.id, 'done', staff.name, numValue);
    setStaffSearch(staff.name);
    setShowStaffInput(false);
  };

  // Handle input value change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (completedBy) {
      const numValue = value ? parseFloat(value) : undefined;
      onUpdate(task.id, 'done', completedBy.name, numValue);
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase())
  );

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        status === 'done'
          ? 'bg-green-50 border-green-200'
          : status === 'na'
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleStatusToggle}
          disabled={disabled}
          className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center
                   transition-all touch-manipulation ${
                     status === 'done'
                       ? 'bg-green-500 border-green-500'
                       : status === 'na'
                       ? 'bg-gray-400 border-gray-400'
                       : 'bg-white border-gray-300 hover:border-gray-400'
                   }`}
          aria-label={`Mark task as ${status === 'done' ? 'N/A' : status === 'na' ? 'not done' : 'done'}`}
        >
          {status === 'done' && (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'na' && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          {/* Task title */}
          <h3
            className={`font-medium text-gray-900 ${
              status === 'done' ? 'line-through text-gray-500' : ''
            }`}
          >
            {task.title}
          </h3>

          {/* Task details */}
          {task.details && task.details.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-sm text-gray-600">
              {task.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-gray-400">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Staff name display (when completed) */}
          {completedBy && status === 'done' && (
            <div className="mt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                {completedBy.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 font-medium">{completedBy.name}</span>
              {completion?.completedAt && (
                <span className="text-xs text-gray-400">
                  {new Date(completion.completedAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          )}

          {/* Numeric input field */}
          {task.requiresInput && status === 'done' && (
            <div className="mt-2">
              <input
                type="number"
                inputMode="decimal"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={task.inputLabel || 'Enter value'}
                disabled={disabled}
                className="w-32 px-3 py-2 border-2 border-gray-200 rounded-lg
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                         focus:outline-none text-sm"
              />
              {task.inputUnit && (
                <span className="ml-2 text-sm text-gray-500">{task.inputUnit}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Staff name input (when marking as done) */}
      {showStaffInput && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Who completed this task?
          </label>
          <input
            type="text"
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
            placeholder="Type name..."
            autoFocus
            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                     focus:outline-none text-sm"
          />

          {/* Staff suggestions */}
          {staffSearch && filteredStaff.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredStaff.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => handleStaffSelect(staff)}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors
                           flex items-center gap-2 touch-manipulation"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    {staff.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{staff.name}</span>
                  {staff.role === 'manager' && (
                    <span className="ml-auto text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                      Manager
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Cancel button */}
          <button
            onClick={() => {
              setShowStaffInput(false);
              setStaffSearch('');
            }}
            className="mt-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskItem;
