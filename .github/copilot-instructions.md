# BBQ Spicy Sandwich - AI Agent Instructions

## Project Overview
Next.js 15+ starter template with Supabase authentication using cookie-based sessions via `@supabase/ssr`. Full-stack TypeScript app with App Router, Server Components, and shadcn/ui components.

## Architecture & Key Patterns

### Supabase Client Usage (CRITICAL)
Never store Supabase clients in global variables—especially important for Fluid compute. Always create fresh clients per function:

**Server Components & Route Handlers:**
```typescript
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient(); // Note: async
```

**Client Components:**
```typescript
import { createClient } from "@/lib/supabase/client";
const supabase = createClient(); // Synchronous
```

**Middleware/Proxy:**
Use `@/lib/supabase/proxy` for session management. See `proxy.ts` at root.

### Server vs Client Component Patterns
- **Server Components (default):** Auth checks, data fetching, layouts. Use `@/lib/supabase/server`.
- **Client Components (`"use client"`):** Forms, interactive UI, theme switching. Use `@/lib/supabase/client`.
- Auth components like `AuthButton` are Server Components that render Client Components (e.g., `LogoutButton`) for interactive parts.

### Authentication Flow
1. **Protected routes:** Middleware in `proxy.ts` redirects unauthenticated users to `/auth/login`
2. **Session refresh:** `lib/supabase/proxy.ts` `updateSession()` handles cookie-based auth—never modify between `createServerClient` and `getClaims()`
3. **Email confirmation:** Sign-up requires email verification; callback handled in `app/auth/callback/route.ts`
4. **User checks:** Use `supabase.auth.getClaims()` (fast) over `getUser()` in protected pages

### Routing Structure
```
app/
  auth/        # Public auth pages (login, sign-up, forgot-password)
  protected/   # Auth-required pages with shared layout
proxy.ts       # Middleware config at root (not in app/)
```

### Component & Styling Conventions
- **shadcn/ui:** UI components in `components/ui/`. Use existing components; configured in `components.json`
- **Styling:** Tailwind CSS with CSS variables for theming (see `app/globals.css`). Dark mode via `next-themes`
- **Utility:** `cn()` helper (`lib/utils.ts`) for conditional class merging: `cn("base-classes", condition && "conditional-classes")`
- **Path aliases:** `@/*` maps to root (`tsconfig.json`)

### Form Handling Pattern
Authentication forms (`login-form.tsx`, `sign-up-form.tsx`) follow this pattern:
```typescript
"use client";
const [isLoading, setIsLoading] = useState(false);
const supabase = createClient(); // Client-side supabase
// Handle form submission with loading state and error handling
// Redirect with router.push() after success
```

## Development Workflow

### Setup
```bash
npm install
npm run dev          # Start dev server on :3000
```

**Environment:** Requires `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `ANON_KEY`)

### Build & Lint
```bash
npm run build        # Production build
npm run start        # Run production build
npm run lint         # ESLint check
```

## Common Tasks

### Adding Protected Pages
1. Create page in `app/protected/` directory
2. Use server-side Supabase client for auth checks
3. Redirect to login if `getClaims()` returns no user (see `app/protected/page.tsx`)

### Adding Auth Forms
- Extend existing pattern from `components/*-form.tsx`
- Mark as `"use client"`
- Use client-side Supabase client
- Handle loading states and errors consistently

### Adding UI Components
- Use shadcn/ui CLI: `npx shadcn@latest add <component>`
- Components auto-install to `components/ui/`
- Already configured: button, card, input, label, checkbox, dropdown-menu

### Modifying Auth Redirects
Edit `lib/supabase/proxy.ts` `updateSession()` function. CRITICAL: Never add code between `createServerClient` and `getClaims()` calls.

## Important Gotchas
- **Cookie management:** Must return the exact `supabaseResponse` from middleware to avoid session termination
- **Environment check:** `hasEnvVars` in `lib/utils.ts` validates Supabase config
- **Proxy matcher:** Configure protected paths in `proxy.ts` config.matcher (excludes static files by default)
- **TypeScript strict mode:** Enabled—handle null checks for auth user objects
- **React 19:** Uses latest React with new JSX transform (`react-jsx`)
