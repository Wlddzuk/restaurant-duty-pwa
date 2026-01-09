# Restaurant Duty PWA - Project Structure

```
restaurant-duty-pwa/
├── app/
│   ├── layout.tsx                    # Root layout with PWA meta tags
│   ├── page.tsx                      # Home - template selection
│   ├── checklist/
│   │   └── [templateId]/
│   │       └── page.tsx              # Active checklist view
│   ├── review/
│   │   └── page.tsx                  # Manager review before submission
│   ├── settings/
│   │   └── page.tsx                  # Staff/Manager registry management
│   ├── api/
│   │   ├── submit/
│   │   │   └── route.ts              # POST: Sheets + Drive submission
│   │   └── health/
│   │       └── route.ts              # GET: API health check
│   └── globals.css                   # Tailwind + custom styles
│
├── components/
│   ├── ui/
│   │   ├── AutocompleteInput.tsx     # Reusable name selector (44px+ targets)
│   │   ├── TouchCheckbox.tsx         # iPad-optimized checkbox
│   │   ├── TouchButton.tsx           # Large touch-friendly button
│   │   ├── SyncStatusBadge.tsx       # Shows pending/synced/failed state
│   │   └── PinInput.tsx              # 4-digit PIN entry with masking
│   ├── modals/
│   │   ├── ManagerAuthModal.tsx      # PIN verification modal
│   │   ├── ForceCloseSessionModal.tsx # Manager override for stuck sessions
│   │   └── AddStaffModal.tsx         # Inline staff addition
│   ├── checklist/
│   │   ├── TaskItem.tsx              # Individual task with Done/Not Done/N/A
│   │   ├── TaskSection.tsx           # Grouped tasks by area
│   │   ├── ChecklistHeader.tsx       # Shows template name, staff, progress
│   │   └── ChecklistProgress.tsx     # Visual progress indicator
│   └── layout/
│       ├── AppShell.tsx              # Main app wrapper
│       ├── BottomNav.tsx             # iPad-friendly navigation
│       └── OfflineIndicator.tsx      # Shows when offline
│
├── lib/
│   ├── db/
│   │   ├── index.ts                  # Dexie database initialization
│   │   ├── schema.ts                 # Database schema version management
│   │   └── migrations.ts             # Schema migration handlers
│   ├── stores/
│   │   ├── useSessionStore.ts        # Current checklist session (Zustand)
│   │   ├── useAuthStore.ts           # Current user/manager state
│   │   └── useSyncStore.ts           # Sync queue and status
│   ├── google/
│   │   ├── sheets.ts                 # Google Sheets API helpers
│   │   ├── drive.ts                  # Google Drive API helpers
│   │   └── auth.ts                   # Service account auth
│   ├── pdf/
│   │   └── generateChecklist.ts      # jsPDF checklist generation
│   ├── utils/
│   │   ├── pinSecurity.ts            # PIN hashing utilities
│   │   ├── deviceId.ts               # Unique device identifier
│   │   ├── dateTime.ts               # Date/time formatting
│   │   └── validation.ts             # Input validation helpers
│   └── constants/
│       └── templates.ts              # Hardcoded duty templates
│
├── types/
│   ├── index.ts                      # Re-exports all types
│   ├── database.ts                   # Dexie/IndexedDB types
│   ├── templates.ts                  # DutyTemplate types
│   ├── checklist.ts                  # ChecklistInstance types
│   ├── staff.ts                      # StaffMember & Manager types
│   └── sync.ts                       # Submission & sync types
│
├── hooks/
│   ├── useChecklist.ts               # Checklist operations
│   ├── useStaffRegistry.ts           # Staff CRUD operations
│   ├── useManagerAuth.ts             # PIN verification
│   ├── useOfflineSync.ts             # Background sync logic
│   └── useDeviceSession.ts           # Device-locked session management
│
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── fonts/                        # Custom fonts if needed
│
├── .env.local                        # Environment variables (Google creds)
├── .env.example                      # Template for env vars
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind with custom theme
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

## Key Architecture Decisions

### 1. Offline-First with Dexie.js
- All data writes go to IndexedDB FIRST
- Background sync pushes to Google APIs when online
- Transactional outbox pattern prevents data loss

### 2. Device-Locked Sessions
- Each checklist session is bound to a device UUID
- Prevents multi-device conflicts
- Manager can force-close stuck sessions

### 3. Soft Delete for Staff
- `active: boolean` flag instead of hard delete
- Preserves historical data integrity in logs
- Deactivated staff hidden from autocomplete

### 4. iPad-Optimized UI
- Minimum 44px touch targets throughout
- Large, clear typography
- Gesture-friendly interactions
