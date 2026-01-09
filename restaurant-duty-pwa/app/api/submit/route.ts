/**
 * POST /api/submit
 * 
 * Handles checklist submission to Google Sheets and Drive.
 * 
 * Flow:
 * 1. Validate request payload
 * 2. Create row in Google Sheets (14 columns)
 * 3. Generate PDF using jsPDF
 * 4. Upload PDF to Google Drive
 * 5. Update Sheets row with PDF link
 * 6. Return success with file IDs
 * 
 * Idempotency: Uses submission ID to prevent duplicate entries
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  SubmissionSnapshot,
  SheetsLogRow,
  SubmitResponse,
} from '@/types';

// Types for request/response
interface SubmitRequestBody {
  /** Unique submission ID (idempotency key) */
  submissionId: string;
  /** Snapshot of checklist data */
  snapshot: SubmissionSnapshot;
}

// Validation helper
function validateSubmission(body: unknown): body is SubmitRequestBody {
  if (!body || typeof body !== 'object') return false;
  
  const obj = body as Record<string, unknown>;
  
  if (typeof obj.submissionId !== 'string' || !obj.submissionId) return false;
  if (!obj.snapshot || typeof obj.snapshot !== 'object') return false;
  
  const snapshot = obj.snapshot as Record<string, unknown>;
  
  // Required snapshot fields
  const requiredFields = [
    'date',
    'area',
    'templateName',
    'templateId',
    'staff',
    'manager',
    'completionPercentage',
    'doneCount',
    'notDoneCount',
    'naCount',
    'totalTasks',
    'startedAt',
    'submittedAt',
    'approvedAt',
    'tasks',
    'deviceId',
  ];
  
  for (const field of requiredFields) {
    if (!(field in snapshot)) return false;
  }
  
  return true;
}

// Transform snapshot to Sheets row
function createSheetsRow(snapshot: SubmissionSnapshot, pdfLink: string): SheetsLogRow {
  const startDate = new Date(snapshot.startedAt);
  const submitDate = new Date(snapshot.submittedAt);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    date: snapshot.date,
    dayOfWeek: dayNames[startDate.getDay()],
    area: snapshot.area,
    dutyType: snapshot.templateId === 'closing' ? 'Closing' : 'Opening',
    staffName: snapshot.staff.name,
    managerName: snapshot.manager.name,
    completionPercent: snapshot.completionPercentage,
    doneCount: snapshot.doneCount,
    notDoneCount: snapshot.notDoneCount,
    naCount: snapshot.naCount,
    totalTasks: snapshot.totalTasks,
    startTime: startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    submitTime: submitDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    pdfLink,
  };
}

// Format row as array for Sheets API
function formatRowForSheets(row: SheetsLogRow): string[] {
  return [
    row.date,
    row.dayOfWeek,
    row.area,
    row.dutyType,
    row.staffName,
    row.managerName,
    String(row.completionPercent),
    String(row.doneCount),
    String(row.notDoneCount),
    String(row.naCount),
    String(row.totalTasks),
    row.startTime,
    row.submitTime,
    row.pdfLink,
  ];
}

export async function POST(request: NextRequest): Promise<NextResponse<SubmitResponse>> {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request
    if (!validateSubmission(body)) {
      return NextResponse.json(
        {
          success: false,
          submissionId: body?.submissionId || 'unknown',
          status: 'failed',
          error: 'Invalid request payload',
        },
        { status: 400 }
      );
    }
    
    const { submissionId, snapshot } = body;
    
    // TODO: Check for idempotency (existing submission with same ID)
    // This would query a submissions table or check Sheets for duplicate
    
    // Step 1: Generate PDF
    // TODO: Implement PDF generation with jsPDF
    // const pdfBuffer = await generateChecklistPdf(snapshot);
    const pdfBuffer = Buffer.from('placeholder'); // Placeholder
    
    // Step 2: Upload PDF to Google Drive
    // TODO: Implement Google Drive upload
    // const driveResult = await uploadToDrive(pdfBuffer, snapshot);
    const driveFileId = 'placeholder_drive_id';
    const driveFileUrl = `https://drive.google.com/file/d/${driveFileId}/view`;
    
    // Step 3: Create Sheets row with PDF link
    const sheetsRow = createSheetsRow(snapshot, driveFileUrl);
    const rowData = formatRowForSheets(sheetsRow);
    
    // TODO: Implement Google Sheets append
    // const sheetsResult = await appendToSheets(rowData);
    const sheetsRowId = 'placeholder_row_id';
    
    // Return success response
    return NextResponse.json({
      success: true,
      submissionId,
      status: 'complete',
      sheetsRowId,
      driveFileId,
      driveFileUrl,
    });
    
  } catch (error) {
    console.error('Submission error:', error);
    
    return NextResponse.json(
      {
        success: false,
        submissionId: 'unknown',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Health check for the endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/submit',
    methods: ['POST'],
    description: 'Submit checklist to Google Sheets and Drive',
  });
}
