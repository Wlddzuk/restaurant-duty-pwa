/**
 * TaskRow Component
 *
 * Displays a single task with:
 * - Task title and details
 * - Three-state toggle (Done / Not Done / N/A)
 * - Staff name input with autocomplete
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { DutyTask, TaskCompletionStatus, StaffMember } from '@/types';

interface TaskRowProps {
  task: DutyTask;
  status: TaskCompletionStatus;
  staffName?: string;
  staffList: StaffMember[];
  onStatusChange: (status: TaskCompletionStatus) => void;
  onStaffNameChange?: (name: string) => void;
  disabled?: boolean;
  hideStaffName?: boolean;
}

export default function TaskRow({
  task,
  status,
  staffName,
  staffList,
  onStatusChange,
  onStaffNameChange,
  disabled = false,
  hideStaffName = false,
}: TaskRowProps) {
  const [inputValue, setInputValue] = useState(staffName || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<StaffMember[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update input when staffName prop changes
  useEffect(() => {
    setInputValue(staffName || '');
  }, [staffName]);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = staffList.filter((s) =>
        s.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions(staffList.slice(0, 5));
    }
  }, [inputValue, staffList]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusClick = (newStatus: TaskCompletionStatus) => {
    if (disabled) return;
    onStatusChange(newStatus);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    // Delay to allow suggestion click
    setTimeout(() => {
      if (inputValue !== staffName && onStaffNameChange) {
        onStaffNameChange(inputValue);
      }
      setShowSuggestions(false);
    }, 200);
  };

  const handleSuggestionClick = (name: string) => {
    setInputValue(name);
    onStaffNameChange?.(name);
    setShowSuggestions(false);
  };

  const handleClearName = () => {
    if (disabled) return;
    if (window.confirm('Clear staff name and reset task?')) {
      setInputValue('');
      onStaffNameChange?.('');
      onStatusChange('not_done');
    }
  };

  const isHighPriority = task.priority === 'high';

  return (
    <div
      className={`border-b border-gray-100 ${
        isHighPriority ? 'bg-amber-50' : 'bg-white'
      }`}
    >
      <div className="px-4 py-3">
        {/* Task title and details */}
        <div className="mb-3">
          <p
            className={`text-gray-900 ${
              isHighPriority ? 'font-semibold' : 'font-medium'
            }`}
          >
            {isHighPriority && (
              <span className="text-amber-600 mr-1">!</span>
            )}
            {task.title}
          </p>
          {task.details && task.details.length > 0 && (
            <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
              {task.details.map((detail, idx) => (
                <li key={idx}>{detail}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Status toggles and staff name */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => handleStatusClick('done')}
              disabled={disabled}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
                status === 'done'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg
                className="w-4 h-4 inline mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Done
            </button>

            <button
              onClick={() => handleStatusClick('not_done')}
              disabled={disabled}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
                status === 'not_done'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg
                className="w-4 h-4 inline mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Not Done
            </button>

            <button
              onClick={() => handleStatusClick('na')}
              disabled={disabled}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
                status === 'na'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              N/A
            </button>
          </div>

          {/* Staff name input - hidden for single-staff templates */}
          {!hideStaffName && (
          <div className="relative flex-1 min-w-[150px]">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={handleInputBlur}
                placeholder="Staff name"
                disabled={disabled}
                className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none ${
                  disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
              />
              {inputValue && !disabled && (
                <button
                  onClick={handleClearName}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && !disabled && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto"
              >
                {suggestions.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleSuggestionClick(staff.name)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                  >
                    {staff.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
