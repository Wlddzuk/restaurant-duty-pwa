/**
 * Home Page - Template Selection
 *
 * Simple table-based list of available checklists.
 * Staff can start a new checklist or continue an in-progress one.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TEMPLATE_PREVIEWS } from '@/lib/constants/templates';
import { db } from '@/lib/db';
import type { TemplatePreview, ChecklistInstance } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [activeChecklists, setActiveChecklists] = useState<Record<string, ChecklistInstance>>({});
  const [isLoading, setIsLoading] = useState(true);

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

  // Load active checklists on mount
  useEffect(() => {
    const loadActiveChecklists = async () => {
      try {
        const checklists = await db.checklists
          .where('status')
          .anyOf(['in_progress', 'pending_review'])
          .toArray();

        const byTemplate: Record<string, ChecklistInstance> = {};
        checklists.forEach((c) => {
          // Keep the most recent one for each template
          if (!byTemplate[c.templateId] ||
              new Date(c.lastModifiedAt) > new Date(byTemplate[c.templateId].lastModifiedAt)) {
            byTemplate[c.templateId] = c;
          }
        });

        setActiveChecklists(byTemplate);
      } catch (error) {
        console.error('Failed to load active checklists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveChecklists();
  }, []);

  // Handle template selection
  const handleStart = (template: TemplatePreview) => {
    const activeChecklist = activeChecklists[template.id];

    if (activeChecklist) {
      // Continue existing checklist
      router.push(`/checklist/${template.id}?resume=${activeChecklist.id}`);
    } else {
      // Start new checklist
      router.push(`/checklist/${template.id}`);
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner">
          You're offline. Changes will sync when connection is restored.
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Templates</h1>
      </header>

      {/* Template table */}
      <main className="flex-1 p-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            <div>Workflow name</div>
            <div className="w-36 text-center">Type</div>
            <div className="w-24 text-center">Action</div>
          </div>

          {/* Table rows */}
          {isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Loading...
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {TEMPLATE_PREVIEWS.map((template) => {
                const activeChecklist = activeChecklists[template.id];
                const isInProgress = !!activeChecklist;
                const progress = activeChecklist?.completionPercentage || 0;

                return (
                  <div
                    key={template.id}
                    className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-4 items-center hover:bg-gray-50 transition-colors"
                  >
                    {/* Workflow name */}
                    <div className="text-gray-900 font-medium">
                      {template.name}
                      {isInProgress && (
                        <span className="ml-2 text-sm text-blue-600">
                          ({progress}% complete)
                        </span>
                      )}
                    </div>

                    {/* Type */}
                    <div className="w-36 text-center text-sm text-gray-600">
                      {template.displayType}
                    </div>

                    {/* Action button */}
                    <div className="w-24">
                      <button
                        onClick={() => handleStart(template)}
                        className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        {isInProgress ? 'Continue' : 'Start'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-sm font-medium">Templates</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
