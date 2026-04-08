# Igreja 360 Graus - Agent Instructions

## Project Overview
Church management system (igreja-360Graus) built with React + Vite + Supabase + shadcn/ui.

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Realtime)
- **State**: TanStack Query v5, React Router v6
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Build**: Bun (primary), npm (fallback)

## Commands
```bash
bun dev          # Start dev server (http://localhost:5173)
bun build        # Production build
bun test         # Run tests (vitest)
bun test:watch   # Watch mode
bun lint         # ESLint
```

## Database Migrations
- Location: `supabase/migrations/`
- Run: `supabase db push` or apply via Supabase dashboard
- Types auto-generated from schema - regenerate with TypeScript types if schema changes

## Key Directories
- `src/pages/` - Page components (portal/, admin/)
- `src/components/` - Shared UI components
- `src/hooks/` - React Query hooks (use*.tsx pattern)
- `src/integrations/supabase/` - Supabase client and types
- `supabase/functions/` - Edge functions (Deno)
- `supabase/migrations/` - Database migrations

## Architecture Notes

### Portal vs Admin
- `/portal/*` - Member-facing app (glassmorphism UI)
- `/app/*` - Admin/management dashboard
- `/parent/*` - Parent portal for children's ministry

### Unified Schedules System
- `useMyUnifiedSchedules` - Hook that combines `volunteer_schedules` (general) + `staff_schedules` (kids ministry)
- Origin field (`'general'` | `'infantil'`) determines which table to update

### Event System
- Events stored in `ministry_events`
- Paid events: `is_paid_event = true`, `ticket_price > 0`
- Registrations in `event_registrations`
- QR Code check-in via `process_event_checkin` / `process_event_checkout` RPC functions

### Role System
- Roles: `admin`, `tesoureiro`, `pastor`, `lider`, `user`, `parent`, `membro`
- Check via `useRole()` hook
- Admin routes wrapped with `<AdminRoute>`

## Common Patterns

### Creating a new hook:
1. Follow `use*.tsx` naming convention
2. Export from `src/hooks/index.ts` if exists
3. Use `useAuth()` for user context
4. Use `queryClient.invalidateQueries()` for cache invalidation

### Adding a new page:
1. Create in `src/pages/portal/` or `src/pages/admin/`
2. Add lazy import in `App.tsx`
3. Add route in App component
4. Add nav link in layout component (PortalLayout, AppSidebar)

### Database operations:
- Use typed Supabase client from `@/integrations/supabase/client`
- RPC functions need `as any` cast if not in types (common for new functions)
- New table types need to be added to `src/integrations/supabase/types.ts`

## Environment Variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- See `.env` file for complete list

## Important Quirks
- TypeScript types in `types.ts` may be out of sync with database schema
- Edge functions use Deno runtime, not Node.js
- shadcn/ui components in `src/components/ui/`
- Custom components in `src/components/[feature]/`
