/**
 * SectionHeader Component
 *
 * Sticky header for checklist sections showing title and progress.
 */

'use client';

interface SectionHeaderProps {
  title: string;
  doneCount: number;
  totalCount: number;
}

export default function SectionHeader({ title, doneCount, totalCount }: SectionHeaderProps) {
  const percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isComplete = doneCount === totalCount && totalCount > 0;

  return (
    <div className="section-header flex items-center justify-between">
      <span className="font-semibold text-gray-800">{title}</span>
      <span
        className={`text-sm ${
          isComplete ? 'text-green-600 font-medium' : 'text-gray-500'
        }`}
      >
        {doneCount}/{totalCount} done
        {isComplete && (
          <svg
            className="w-4 h-4 inline ml-1 text-green-600"
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
        )}
      </span>
    </div>
  );
}
