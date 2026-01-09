/**
 * Home Page - Template Selection
 *
 * Entry point for the app. Staff select which checklist to complete:
 * - Pass Opening (morning kitchen prep)
 * - Floor Opening (dining room setup)
 * - Closing (end of day)
 *
 * Flow:
 * 1. Staff sees template cards
 * 2. Taps a template
 * 3. Enters their name (autocomplete)
 * 4. Proceeds to checklist
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TEMPLATE_PREVIEWS } from '@/lib/constants/templates';
import { useSessionStore } from '@/lib/stores/useSessionStore';
import { useStaffRegistry } from '@/hooks/useStaffRegistry';
import AutocompleteInput from '@/components/ui/AutocompleteInput';
import type { StaffMember, TemplateId, TemplatePreview } from '@/types';

// Icon components for templates
function ChefHatIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 14v8m-4-8v8m8-8v8M6 14h12M8 6a4 4 0 118 0M6 10a6 6 0 0012 0" />
    </svg>
  );
}

function ChairIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 9h18M3 15h18M6 9v12M18 9v12M9 3h6v6H9V3z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

const ICONS = {
  utensils: ChefHatIcon,
  layout: ChairIcon,
  moon: MoonIcon,
};

export default function HomePage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePreview | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const { activeStaff, addStaff, activeManagers } = useStaffRegistry();
  const { startChecklist, checkForActiveSessions } = useSessionStore();

  // Monitor online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle template selection
  const handleTemplateSelect = async (template: TemplatePreview) => {
    // Check for existing sessions
    const existingSession = await checkForActiveSessions(template.id);

    if (existingSession) {
      if (existingSession.isOwnDevice) {
        // Resume own session
        router.push(`/checklist/${template.id}?resume=${existingSession.checklistId}`);
        return;
      } else {
        // Session on another device - show warning
        alert(
          `${existingSession.staffName} started this checklist on another iPad at ` +
          `${new Date(existingSession.startedAt).toLocaleTimeString()}. ` +
          `Ask a manager to close it first.`
        );
        return;
      }
    }

    setSelectedTemplate(template);
    setShowNameInput(true);
  };

  // Handle staff selection
  const handleStaffSelect = async (staff: StaffMember) => {
    if (!selectedTemplate) return;

    await startChecklist(selectedTemplate.id, {
      id: staff.id,
      name: staff.name,
      role: staff.role,
    });

    router.push(`/checklist/${selectedTemplate.id}`);
  };

  // Handle adding new staff (requires manager PIN - simplified for now)
  const handleAddNewStaff = async (name: string) => {
    // In a real implementation, this would trigger ManagerAuthModal first
    const newStaff = await addStaff({ name, role: 'staff' });
    if (newStaff) {
      handleStaffSelect(newStaff);
    }
  };

  // Get current greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Mock progress for now (0-100) - this will come from actual checklist data later
  const getProgress = (templateId: TemplateId): number => {
    // TODO: Get actual progress from IndexedDB
    return 0; // No progress yet
  };

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Header with offline indicator and settings */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}
            </h1>
            <p className="text-gray-500 mt-1">
              Select a checklist to begin
            </p>
          </div>

          {/* Right side: Offline indicator + Settings */}
          <div className="flex items-center gap-3">
            {/* Offline indicator - small icon */}
            {!isOnline && (
              <div className="flex items-center gap-2 text-amber-600" title="Offline mode">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                </svg>
              </div>
            )}

            {/* Settings button - top right */}
            <button
              onClick={() => router.push('/settings')}
              className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100
                       rounded-xl transition-all active:scale-95 touch-manipulation"
              aria-label="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Template cards */}
      <main className="flex-1 px-6 py-6">
        <div className="grid gap-4 max-w-3xl mx-auto">
          {TEMPLATE_PREVIEWS.map((template) => {
            const IconComponent = ICONS[template.icon];
            const progress = getProgress(template.id);

            return (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5
                         hover:shadow-md active:scale-[0.98] transition-all duration-200
                         text-left touch-manipulation"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center
                             text-white flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: template.accentColor }}
                  >
                    <IconComponent />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {template.name}
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">
                      {template.description}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>{template.totalTasks} tasks</span>
                        {progress > 0 && <span>{progress}% complete</span>}
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

                  {/* Arrow */}
                  <svg className="w-6 h-6 text-gray-400 flex-shrink-0 self-center"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Name selection modal */}
      {showNameInput && selectedTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                   bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNameInput(false);
              setSelectedTemplate(null);
            }
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-3xl sm:rounded-2xl p-6 pb-8
                        animate-slide-up shadow-2xl">
            {/* Handle bar (mobile only) */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6 sm:hidden" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: selectedTemplate.accentColor }}
              >
                {(() => {
                  const IconComponent = ICONS[selectedTemplate.icon];
                  return <IconComponent />;
                })()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedTemplate.name}
                </h2>
                <p className="text-gray-500 text-sm">
                  Who's completing this checklist?
                </p>
              </div>
            </div>

            {/* Name input */}
            <AutocompleteInput
              staffList={activeStaff}
              onSelect={handleStaffSelect}
              onAddNew={handleAddNewStaff}
              placeholder="Type your name..."
              label="Your Name"
              size="large"
            />

            {/* Cancel button */}
            <button
              onClick={() => {
                setShowNameInput(false);
                setSelectedTemplate(null);
              }}
              className="w-full mt-4 h-12 text-gray-600 font-medium
                       hover:bg-gray-100 rounded-xl transition-all active:scale-[0.98]
                       touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
