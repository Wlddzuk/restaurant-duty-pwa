/**
 * AutocompleteInput Component
 * 
 * iPad-optimized name selector with:
 * - 44px+ touch targets for easy tapping during busy shifts
 * - Fuzzy search through staff names
 * - Inline "Add New" option when no match found (requires manager PIN)
 * - Keyboard support for accessibility
 * 
 * Usage:
 * <AutocompleteInput
 *   staffList={activeStaff}
 *   onSelect={(staff) => setSelectedStaff(staff)}
 *   placeholder="Select your name"
 * />
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { StaffMember } from '@/types';

interface AutocompleteInputProps {
  /** List of staff members to search through */
  staffList: StaffMember[];
  /** Callback when a staff member is selected */
  onSelect: (staff: StaffMember) => void;
  /** Optional callback to add new staff (shows "Add" option if provided) */
  onAddNew?: (name: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Filter by role (optional) */
  roleFilter?: 'staff' | 'manager';
  /** Currently selected value (for controlled input) */
  value?: StaffMember | null;
  /** Custom label */
  label?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Size variant */
  size?: 'default' | 'large';
}

export function AutocompleteInput({
  staffList,
  onSelect,
  onAddNew,
  placeholder = 'Type to search...',
  roleFilter,
  value,
  label,
  disabled = false,
  error,
  size = 'default',
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(value?.name || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter staff based on input and role
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch = staff.name
      .toLowerCase()
      .includes(inputValue.toLowerCase());
    const matchesRole = roleFilter ? staff.role === roleFilter : true;
    const isActive = staff.active;
    return matchesSearch && matchesRole && isActive;
  });

  // Check if current input matches any existing name exactly
  const hasExactMatch = filteredStaff.some(
    (staff) => staff.name.toLowerCase() === inputValue.toLowerCase()
  );

  // Show "Add new" option if no exact match and callback provided
  const showAddOption = onAddNew && inputValue.trim() && !hasExactMatch;

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync controlled value
  useEffect(() => {
    if (value) {
      setInputValue(value.name);
    }
  }, [value]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('li');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectStaff = useCallback(
    (staff: StaffMember) => {
      setInputValue(staff.name);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onSelect(staff);
      // Haptic feedback for selection
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    },
    [onSelect]
  );

  const handleAddNew = useCallback(() => {
    if (onAddNew && inputValue.trim()) {
      onAddNew(inputValue.trim());
      setIsOpen(false);
    }
  }, [onAddNew, inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = filteredStaff.length + (showAddOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (highlightedIndex < filteredStaff.length) {
            handleSelectStaff(filteredStaff[highlightedIndex]);
          } else if (showAddOption) {
            handleAddNew();
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    setInputValue('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // Size classes for iPad optimization
  const sizeClasses = {
    default: {
      input: 'h-12 text-base px-4', // 48px - above 44px minimum
      item: 'min-h-[48px] px-4 py-3',
    },
    large: {
      input: 'h-14 text-lg px-5', // 56px
      item: 'min-h-[56px] px-5 py-4 text-lg',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full rounded-xl border-2 transition-all duration-200
            ${classes.input}
            ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-4
            placeholder:text-gray-400
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />

        {/* Clear button */}
        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 
                       text-gray-400 hover:text-gray-600 
                       touch-manipulation"
            aria-label="Clear input"
          >
            <svg
              className="w-5 h-5"
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

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (filteredStaff.length > 0 || showAddOption) && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-xl 
                     border-2 border-gray-200 shadow-lg overflow-hidden
                     max-h-[300px] overflow-y-auto"
          role="listbox"
        >
          {filteredStaff.map((staff, index) => (
            <li
              key={staff.id}
              onClick={() => handleSelectStaff(staff)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`
                ${classes.item}
                flex items-center gap-3 cursor-pointer
                touch-manipulation transition-colors duration-100
                ${
                  highlightedIndex === index
                    ? 'bg-blue-50 text-blue-900'
                    : 'hover:bg-gray-50'
                }
                ${index !== filteredStaff.length - 1 || showAddOption ? 'border-b border-gray-100' : ''}
              `}
              role="option"
              aria-selected={highlightedIndex === index}
            >
              {/* Avatar circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  text-white font-semibold text-sm
                  ${staff.role === 'manager' ? 'bg-purple-500' : 'bg-blue-500'}
                `}
              >
                {staff.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <span className="font-medium">{staff.name}</span>
                {staff.role === 'manager' && (
                  <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                    Manager
                  </span>
                )}
              </div>
            </li>
          ))}

          {/* Add new option */}
          {showAddOption && (
            <li
              onClick={handleAddNew}
              onMouseEnter={() => setHighlightedIndex(filteredStaff.length)}
              className={`
                ${classes.item}
                flex items-center gap-3 cursor-pointer
                touch-manipulation transition-colors duration-100
                ${
                  highlightedIndex === filteredStaff.length
                    ? 'bg-green-50 text-green-900'
                    : 'hover:bg-gray-50'
                }
              `}
              role="option"
              aria-selected={highlightedIndex === filteredStaff.length}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-white">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <span className="font-medium text-green-700">
                  Add "{inputValue.trim()}" as new staff
                </span>
                <span className="block text-xs text-green-600">
                  Requires manager PIN
                </span>
              </div>
            </li>
          )}
        </ul>
      )}

      {/* No results message */}
      {isOpen && inputValue && filteredStaff.length === 0 && !showAddOption && (
        <div
          className="absolute z-50 w-full mt-2 bg-white rounded-xl 
                        border-2 border-gray-200 shadow-lg p-4 text-center text-gray-500"
        >
          No matching staff found
        </div>
      )}
    </div>
  );
}

export default AutocompleteInput;
