/**
 * Sync & Submission Type Definitions
 * 
 * Handles the transactional outbox pattern for reliable Google API uploads:
 * 1. Write to IndexedDB first (never lose data)
 * 2. Attempt Google Sheets write
 * 3. Generate and upload PDF to Drive
 * 4. Update status in IndexedDB
 * 
 * Partial failures are handled gracefully with retry logic.
 */

import type { ChecklistInstance, TaskCompletion } from './checklist';
import type { StaffReference } from './staff';
import type { TemplateId } from './templates';

/**
 * Submission status through the sync pipeline
 */
export type SubmissionStatus = 
  | 'pending'       // In queue, not yet attempted
  | 'sheets_done'   // Sheets write succeeded, PDF pending
  | 'complete'      // Fully synced (Sheets + Drive)
  | 'failed';       // Failed after max retries

/**
 * PDF generation status (tracked separately for partial recovery)
 */
export type PdfStatus = 'pending' | 'generated' | 'uploaded' | 'failed';

/**
 * Submission record stored in IndexedDB outbox
 */
export interface PendingSubmission {
  /** Unique submission ID (UUID) - serves as idempotency key */
  id: string;
  
  /** Reference to the checklist instance */
  checklistId: string;
  
  /** Current status in sync pipeline */
  status: SubmissionStatus;
  
  /** PDF generation/upload status */
  pdfStatus: PdfStatus;
  
  /** Google Sheets row ID (if Sheets write succeeded) */
  sheetsRowId?: string;
  
  /** Google Drive file ID (if PDF upload succeeded) */
  driveFileId?: string;
  
  /** Google Drive file URL for reference */
  driveFileUrl?: string;
  
  /** Number of sync attempts */
  retryCount: number;
  
  /** Maximum retry attempts before marking as failed */
  maxRetries: number;
  
  /** ISO timestamp of submission creation */
  createdAt: string;
  
  /** ISO timestamp of last sync attempt */
  lastAttemptAt?: string;
  
  /** ISO timestamp when successfully completed */
  completedAt?: string;
  
  /** Error log for debugging */
  errorLog: SyncError[];
  
  /** Snapshot of data at submission time (for retry resilience) */
  snapshot: SubmissionSnapshot;
}

/**
 * Error record for sync failures
 */
export interface SyncError {
  /** ISO timestamp of error */
  timestamp: string;
  
  /** Which step failed */
  step: 'sheets_write' | 'pdf_generate' | 'pdf_upload' | 'sheets_update';
  
  /** Error message */
  message: string;
  
  /** HTTP status code if applicable */
  statusCode?: number;
  
  /** Whether this error is retryable */
  retryable: boolean;
}

/**
 * Immutable snapshot of checklist data at submission time
 * Ensures retries use consistent data even if checklist is modified
 */
export interface SubmissionSnapshot {
  /** ISO date of the checklist (YYYY-MM-DD) */
  date: string;
  
  /** Restaurant area/template name */
  area: string;
  
  /** Full template name */
  templateName: string;
  
  /** Template ID */
  templateId: TemplateId;
  
  /** Staff who completed the checklist */
  staff: StaffReference;
  
  /** Manager who approved */
  manager: StaffReference;
  
  /** Overall completion percentage */
  completionPercentage: number;
  
  /** Count of done tasks */
  doneCount: number;
  
  /** Count of not done tasks */
  notDoneCount: number;
  
  /** Count of N/A tasks */
  naCount: number;
  
  /** Total tasks */
  totalTasks: number;
  
  /** When checklist was started */
  startedAt: string;
  
  /** When checklist was submitted */
  submittedAt: string;
  
  /** When manager approved */
  approvedAt: string;
  
  /** Shift notes from manager */
  shiftNotes?: string;
  
  /** Full task completion data for PDF generation */
  tasks: Record<string, TaskCompletion>;
  
  /** Device ID that completed the checklist */
  deviceId: string;
}

/**
 * The 14-column Google Sheets log row structure
 */
export interface SheetsLogRow {
  /** Column A: Date (YYYY-MM-DD) */
  date: string;
  
  /** Column B: Day of week */
  dayOfWeek: string;
  
  /** Column C: Template/Area name */
  area: string;
  
  /** Column D: Template type (Opening/Closing) */
  dutyType: 'Opening' | 'Closing';
  
  /** Column E: Staff name who completed */
  staffName: string;
  
  /** Column F: Manager name who approved */
  managerName: string;
  
  /** Column G: Completion percentage */
  completionPercent: number;
  
  /** Column H: Tasks completed count */
  doneCount: number;
  
  /** Column I: Tasks not done count */
  notDoneCount: number;
  
  /** Column J: Tasks N/A count */
  naCount: number;
  
  /** Column K: Total tasks */
  totalTasks: number;
  
  /** Column L: Start time (HH:MM) */
  startTime: string;
  
  /** Column M: Submission time (HH:MM) */
  submitTime: string;
  
  /** Column N: PDF link (Drive URL) */
  pdfLink: string;
}

/**
 * Google Drive folder structure
 * Restaurant Checklists / {Area} / {Year} / {Month}
 */
export interface DriveFolderPath {
  rootFolderId: string;
  area: string;
  year: string;
  month: string;
}

/**
 * PDF generation configuration
 */
export interface PdfConfig {
  /** Restaurant name for header */
  restaurantName: string;
  
  /** Logo URL (optional) */
  logoUrl?: string;
  
  /** Page size */
  pageSize: 'a4' | 'letter';
  
  /** Include task details/notes */
  includeDetails: boolean;
  
  /** Include timestamps per task */
  includeTimestamps: boolean;
}

/**
 * Sync queue status summary
 */
export interface SyncQueueStatus {
  /** Total items in queue */
  total: number;
  
  /** Items pending first attempt */
  pending: number;
  
  /** Items with Sheets done, PDF pending */
  sheetsDone: number;
  
  /** Successfully completed items */
  complete: number;
  
  /** Failed items requiring manual intervention */
  failed: number;
  
  /** Currently syncing */
  inProgress: boolean;
  
  /** Last sync attempt timestamp */
  lastSyncAt?: string;
  
  /** Next scheduled sync timestamp */
  nextSyncAt?: string;
}

/**
 * API response for submission endpoint
 */
export interface SubmitResponse {
  success: boolean;
  submissionId: string;
  status: SubmissionStatus;
  sheetsRowId?: string;
  driveFileId?: string;
  driveFileUrl?: string;
  error?: string;
}

/**
 * Retry configuration
 */
export const SYNC_CONFIG = {
  /** Maximum retry attempts */
  MAX_RETRIES: 5,
  
  /** Base delay between retries in ms */
  BASE_RETRY_DELAY_MS: 1000,
  
  /** Maximum delay between retries in ms */
  MAX_RETRY_DELAY_MS: 60000,
  
  /** Exponential backoff multiplier */
  BACKOFF_MULTIPLIER: 2,
  
  /** Sync interval when online (ms) */
  SYNC_INTERVAL_MS: 30000,
  
  /** Sync interval when items are pending (ms) */
  PENDING_SYNC_INTERVAL_MS: 5000,
} as const;

/**
 * Calculate next retry delay with exponential backoff
 */
export function calculateRetryDelay(retryCount: number): number {
  const delay = SYNC_CONFIG.BASE_RETRY_DELAY_MS * 
    Math.pow(SYNC_CONFIG.BACKOFF_MULTIPLIER, retryCount);
  return Math.min(delay, SYNC_CONFIG.MAX_RETRY_DELAY_MS);
}
