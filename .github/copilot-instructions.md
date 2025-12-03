# Copilot Instructions for BBQ-Spicy-Sandwitch

## Project Overview
This is a Next.js + Supabase starter kit, designed for rapid development of full-stack web apps. It uses the Next.js App Router, Supabase for authentication and data, Tailwind CSS for styling, and shadcn/ui for UI components. The project is structured for clarity and modularity, with clear separation between app pages, API routes, components, and utility libraries.

## Key Architecture & Patterns
- **App Directory Structure**: All main pages and API routes are under `app/`. Subfolders like `journal`, `auth`, and `profile` represent feature areas. API endpoints are in `app/api/*`.
- **Components**: Shared and feature-specific React components are in `components/`, with further grouping (e.g., `journal/`, `tutorial/`, `ui/`). Use these for UI consistency.
- **Supabase Integration**: Supabase client setup is in `lib/supabase/client.ts`. Server-side logic is in `lib/supabase/server.ts`. Use these for all database/auth interactions.
- **Styling**: Tailwind CSS is configured via `tailwind.config.ts` and `postcss.config.mjs`. UI components use shadcn/ui patterns.
- **Environment Variables**: Store Supabase keys in `.env.local` (see README for details). Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Data Flow**: API routes in `app/api/` handle backend logic (e.g., CSV import, journal stats). Frontend pages fetch data via Supabase client or these APIs.

## Developer Workflows
- **Local Development**: Run with `npm run dev` (Next.js dev server at `localhost:3000`).
- **Testing**: Test CSV files are in `test/`. No formal test runner is present; add tests in this folder or use your preferred framework.
- **UI Customization**: To change shadcn/ui styles, delete `components.json` and follow [shadcn/ui docs](https://ui.shadcn.com/docs/installation/next).
- **Schema Management**: Supabase SQL schemas are in `supabase/`. Update these files and apply changes via Supabase dashboard.

## Project-Specific Conventions
- **API Route Structure**: Use Next.js route handlers (`route.ts`) for backend logic. Organize by feature (e.g., `journal/day-detail/route.ts`).
- **Component Grouping**: Place reusable UI in `components/ui/`, feature logic in subfolders (e.g., `components/journal/`).
- **Proxy Usage**: `proxy.ts` and `lib/supabase/proxy.ts` are for advanced routing or Supabase proxying.
- **Auth Flows**: Auth pages and logic are in `app/auth/` and related components.

## Integration Points
- **Supabase**: All data/auth flows use Supabase. See `lib/supabase/` and environment setup.
- **Vercel**: Project is optimized for Vercel deployment; environment variables are auto-assigned if using Supabase integration.

## Examples
- To add a new journal API endpoint: create `app/api/journal/new-endpoint/route.ts`.
- To add a new UI component: add to `components/ui/` and import in your page/component.
- To update Supabase schema: edit `supabase/schema.sql` and apply via dashboard.

---
For more details, see `README.md` and referenced docs. If any conventions or workflows are unclear, please ask for clarification or provide feedback to improve these instructions.
