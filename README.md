# Polyedge.ai - codename BBQ-SPICY-SANDWITCH

# About:

Polyedge.ai is a clean, privacy-first web app that helps Polymarket traders track their positions, journal decisions, and stay informed — without ever making predictions.

## What it does

Live Polymarket odds (updated every few minutes)
Personal trade journal with mood, outcome, notes
Instant replay: see exactly what the market looked like when you traded
AI-powered neutral insights (xAI Grok) → 3 factual bullets about why the market is moving (no forecasts, fully compliant)
Real-time context: Google Trends + X (Twitter) buzz indicators right next to every market
Beautiful, dark-mode dashboard built for speed and clarity

## Core principle

We give you the sharpest information and the best mirror for your own decisions. The trading edge is still 100 % yours.

## Tech Stack:

### Hosting & Deployment

- Platform: Vercel (auto-deploys, preview URLs, edge-ready)

### Frontend

- Framework: Next.js 15 (App Router) + TypeScript
- Styling: Tailwind CSS
- UI Primitives: Radix UI (fully unstyled, accessible components)
- State Management (v1): React Server Components + TanStack Query (for data) + lightweight Zustand (only if needed for UI state)
- Data Fetching & Caching: TanStack Query (auto-refetch, background updates for markets)

### Backend & Database

- Backend: Supabase
  - PostgreSQL database
  - Auth (email + magic links)
  - Row-Level Security for private journals & trades
  - Realtime subscriptions (optional for live market updates)
  - Edge Functions (to securely call xAI API without exposing keys)
  - Storage (for any screenshots or exported PDFs)

### External Data Sources

- Polymarket: Poll public markets endpoint / subgraph (no official public API yet)
- Google Trends: RSS feed or unofficial API
- X (Twitter) buzz: X API v2 search endpoints
- News & sentiment: Whatever you feed into the AI prompt

### AI Chatbot

- Provider: xAI Grok API only (via Supabase Edge Function → secret key stays safe)

### Observability

- Analytics: PostHog (self-hosted or cloud, one script tag)
- Error Tracking: Sentry (one env variable, automatic)

### Testing

- Unit / logic: Jest + React Testing Library
- End-to-end: Cypress (runs in CI)

### DevOps

- CI/CD: GitHub → Vercel automatic builds
- Tests run on every push (Jest → Cypress → deploy only if green)

### Future Mobile (zero rewrite)

- Switch to React Native + Expo when ready (same components, same logic, same Supabase client)
