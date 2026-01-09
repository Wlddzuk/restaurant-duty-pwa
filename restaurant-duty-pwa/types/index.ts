/**
 * Type Definitions Index
 * 
 * Re-exports all types from a single entry point.
 * Import from '@/types' rather than individual files.
 */

// Staff & Manager types
export type {
  StaffRole,
  StaffMember,
  Manager,
  StaffReference,
  CreateStaffInput,
  UpdateStaffInput,
  PinVerificationResult,
} from './staff';

export { PIN_SECURITY } from './staff';

// Template types
export type {
  TemplateId,
  TimeWindow,
  RestaurantArea,
  DutyTask,
  TemplateSection,
  DutyTemplate,
  TemplatePreview,
  TemplateMap,
} from './templates';

// Checklist types
export type {
  ChecklistStatus,
  TaskCompletionStatus,
  TaskCompletion,
  SectionProgress,
  ChecklistInstance,
  StartChecklistInput,
  ApproveChecklistInput,
  ChecklistSummary,
  ActiveSession,
  SessionConflict,
} from './checklist';

export { calculateCompletionStats } from './checklist';

// Sync & Submission types
export type {
  SubmissionStatus,
  PdfStatus,
  PendingSubmission,
  SyncError,
  SubmissionSnapshot,
  SheetsLogRow,
  DriveFolderPath,
  PdfConfig,
  SyncQueueStatus,
  SubmitResponse,
} from './sync';

export { SYNC_CONFIG, calculateRetryDelay } from './sync';

// Database types
export type {
  DeviceConfig,
  AppSettings,
  AuditLogEntry,
  DatabaseTables,
} from './database';

export {
  DB_SCHEMA_VERSIONS,
  CURRENT_DB_VERSION,
  DB_NAME,
} from './database';
