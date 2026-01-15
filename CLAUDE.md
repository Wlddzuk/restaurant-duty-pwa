# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev        # Start development server on localhost:3000
npm run build      # Build production bundle
npm start          # Start production server
npm run lint       # Run ESLint checks
npm run type-check # Run TypeScript type checking (use this before commits)
```

## Architecture Overview

### Core Technologies
- **Next.js 14** with App Router for the web framework
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Dexie.js** for IndexedDB management (offline-first data storage)
- **Zustand** for state management
- **Google APIs** (Sheets + Drive) for cloud synchronization

### Key Architectural Patterns

#### Offline-First Design
- All data writes go to IndexedDB FIRST via Dexie.js
- Background sync pushes to Google APIs when online
- Transactional outbox pattern prevents data loss
- Use `useSyncStore.ts` for managing sync state

#### Device-Locked Sessions
- Each checklist session is bound to a device UUID
- Prevents multi-device conflicts
- Manager can force-close stuck sessions via `ForceCloseSessionModal.tsx`

#### State Management Structure
- `useSessionStore.ts` - Current checklist session state
- `useAuthStore.ts` - Current user/manager authentication
- `useSyncStore.ts` - Sync queue and network status

### Database Layer (lib/db/)
- Uses Dexie.js wrapper around IndexedDB
- Schema versioning in `schema.ts` with migrations in `migrations.ts`
- Soft delete pattern: use `active: boolean` flag instead of hard deletion

### Google Integration (lib/google/)
- Service account authentication in `auth.ts`
- `sheets.ts` for logging checklist submissions
- `drive.ts` for PDF backup uploads
- Environment variables required for cloud features

## Important Development Notes

### Touch-Optimized UI Requirements
- Minimum 44px touch targets for all interactive elements
- Use `TouchButton.tsx` and `TouchCheckbox.tsx` components
- iPad-optimized layouts and typography

### Path Aliases
- Use `@/` prefix for imports from project root (configured in tsconfig.json)

### Environment Configuration
- Copy `.env.example` to `.env.local` for local development
- Google API credentials required for cloud sync features
- PWA features enabled by default in `next.config.js`

### Data Flow for Checklists
1. User selects template from `lib/constants/templates.ts`
2. Session created in `useSessionStore.ts`
3. Data saved to IndexedDB via `lib/db/`
4. Background sync to Google APIs when online

### Type Safety
- All database types in `types/database.ts`
- Template types in `types/templates.ts`
- Always run `npm run type-check` before committing changes