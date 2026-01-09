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
function UtensilsIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
    </svg>
  );
}

function LayoutIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M3 9h18M9 21V9" />
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
  utensils: UtensilsIcon,
  layout: LayoutIcon,
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
  
  return (
    <div className="min-h-full flex flex-col">
      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner">
          You're offline. Changes will sync when connection is restored.
        </div>
      )}
      
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}
        </h1>
        <p className="text-gray-500 mt-1">
          Select a checklist to begin
        </p>
      </header>
      
      {/* Template cards */}
      <main className="flex-1 px-6 pb-8">
        <div className="grid gap-4">
          {TEMPLATE_PREVIEWS.map((template) => {
            const IconComponent = ICONS[template.icon];
            
            return (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="template-card text-left"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="icon flex-shrink-0"
                    style={{ backgroundColor: template.accentColor }}
                  >
                    <IconComponent />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {template.name}
                    </h2>
                    <p className="text-gray-500 mt-0.5">
                      {template.description}
                    </p>
                    
                    {/* Meta info */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {template.totalTasks} tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ~{template.estimatedMinutes} min
                      </span>
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  <svg className="w-6 h-6 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNameInput(false);
              setSelectedTemplate(null);
            }
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-t-3xl p-6 pb-8 animate-slide-up safe-area-inset">
            {/* Handle bar */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
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
              className="w-full mt-4 h-12 text-gray-500 font-medium
                       hover:bg-gray-100 rounded-xl transition-colors touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Footer with settings access */}
      <footer className="px-6 py-4 border-t border-gray-200">
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 
                   transition-colors touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">Settings</span>
        </button>
      </footer>
    </div>
  );
}
