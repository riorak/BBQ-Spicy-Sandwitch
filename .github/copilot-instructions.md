# Copilot Instructions for Polyedge Codebase

## Project Overview
**Polyedge** is a trading journal and analytics application for Polymarket traders built with **Next.js 15** (App Router), **Supabase** (Auth + Database), **TypeScript**, and **Tailwind CSS + shadcn/ui**.

Core purpose: lTrack trades, manage positions, analyze performance, and import market data from Poymarket.

## Architecture Patterns

### Authentication & Access Control
- **Supabase Auth** with cookie-based sessions via `@supabase/ssr` package
- Server-side session validation in middleware (`lib/supabase/proxy.ts`)
- Routes under `/app/*` are protected and redirect unauthenticated users to `/auth/login`
- **Client**: `lib/supabase/client.ts` for browser-side operations
- **Server**: `lib/supabase/server.ts` for Server Components/Route Handlers (creates new client per request for Fluid Compute compatibility)
- Always verify `auth.uid()` matches `user_id` when accessing protected resources

### Frontend Organization
- **App layout**: `app/app/layout.tsx` - Main authenticated shell with sidebar navigation
- **Landing/Auth pages**: `app/page.tsx` (root), `app/auth/*` (login, sign-up, password flows)
- **Pages**: Dashboard, Journal, Analytics, Sessions, Settings, Profile - each in `app/app/<feature>/page.tsx`
- **Components**: Split by feature (`components/<feature>/*`) and shared UI (`components/ui/*` from shadcn/ui)

### Data Model (Supabase)
```
users → trades, day_stats, journal_entries, screenshots
categories → markets (Polymarket categories: politics, sports, crypto, science)
markets → resolved data from Polymarket API sync
```
- **Row-Level Security (RLS)** enforced: Users only access their own data
- **Key tables**: `users`, `trades`, `markets`, `day_stats`, `journal_entries`, `screenshots`, `trade_notes`, `sessions`

### API Routes (Next.js Route Handlers)
Located at `app/app/api/` and `app/api/`:
- **GET/POST** pattern; use `createClient()` server utility for Supabase queries
- Always extract `user_id` via `supabase.auth.getClaims()` and validate authorization
- Return `NextResponse.json()` with proper HTTP status codes (401 for unauthorized)
- Examples: `/journal/day-detail`, `/journal/day-stats`, `/import/csv`, `/sync/polymarket`

## Development Patterns

### Client Components vs Server Components
- Mark client-heavy components with `"use client"` (e.g., forms, stateful journal views)
- Route Handlers and page components default to Server Components
- Use hooks (useState, useEffect) only in client components

### Styling
- **Tailwind CSS** with custom HSL color variables in `globals.css` (dark mode support via `darkMode: ["class"]`)
- **shadcn/ui components** in `components/ui/` (Button, Card, Input, Label, Dropdown, etc.)
- Example pattern: `className="flex items-center gap-2 px-3 py-2 rounded-lg"`
- Dark mode: CSS class `dark` applied to root; toggle via `next-themes`

### Type Safety
- Strict TypeScript (`strict: true`), target ES2017, module resolution `bundler`
- Define interfaces in component files (e.g., `Trade`, `JournalDay` in `journal-view.tsx`)
- Use `NextResponse`, `NextRequest` from `next/server` for Route Handlers

## Specific Workflows

### Journal Feature Workflow
1. **Calendar View** (`calendar-grid.tsx`) - Displays day summary from `day_stats` table
2. **Day Detail Drawer** (`day-detail-drawer.tsx`) - Fetches trades and notes via `/api/journal/day-detail?date=YYYY-MM-DD`
3. **Trade Notes** - Submit to `/api/journal/trade-notes` endpoint (authenticated)
4. **Screenshots** - Upload to S3 via `/api/journal/upload-screenshots`; signed URLs refreshed at `/api/journal/refresh-signed-urls`

### Polymarket Sync
- CSV import: `POST /api/import/csv` - Parse trades, validate markets, insert to `trades` table
- API sync: `POST /api/sync/polymarket` - Fetch markets and resolutions from Polymarket API
- Manual import: `POST /api/journal/import/polymarket` - User-initiated market import

### Category Handling
Categories are **static** (politics, sports, crypto, science) and loaded from `categories` table. Markets reference category via `category_id`. When fetching trades, group by market's category.

## Critical Developer Commands
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm start            # Run production server
npm run lint         # ESLint check
```

## Common Gotchas & Patterns
1. **Session Management**: After `signInWithPassword()`, user session is auto-set; no manual cookie handling needed
2. **Date Handling**: Always use ISO strings (`YYYY-MM-DD`) and UTC timestamps in API calls
3. **File Paths**: Use `@/*` path alias (tsconfig.json) - e.g., `@/components/ui/button`
4. **Supabase Client Creation**: NEVER store client in global variables; create new instance per function call
5. **Error States**: Route Handlers should return proper HTTP status and JSON error message
6. **RLS Policies**: Always check `auth.uid() = user_id` in queries; Supabase enforces this server-side

## Testing Data
Sample trade CSV available at `test/test.csv` for local testing of import workflows.
