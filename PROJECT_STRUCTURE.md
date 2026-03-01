# Teacher Rating — Project Structure

> A **Next.js 16 + TypeScript + Supabase + Tailwind CSS 4** web application that lets students anonymously rate professors on *Teaching* and *Proctoring*, with an admin panel for moderating user-suggested professors.

---

## Root Directory

```
Teacher Rating/
├── .git/                        # Git version control
├── .gitignore                   # Git ignore rules
├── .next/                       # Next.js build output (auto-generated)
├── .vercel/                     # Vercel deployment config (auto-generated)
├── lib/                         # Shared TypeScript types
├── node_modules/                # npm dependencies (auto-generated)
├── public/                      # Static assets served at /
├── scripts/                     # One-off utility scripts
├── src/                         # Application source code
├── supabase/                    # Database schema & migrations
├── eslint.config.mjs            # ESLint configuration
├── next-env.d.ts                # Next.js TypeScript declarations (auto-generated)
├── next.config.ts               # Next.js configuration
├── package.json                 # npm manifest & scripts
├── package-lock.json            # Locked dependency tree
├── postcss.config.mjs           # PostCSS configuration
├── README.md                    # Project readme
├── teachers_data.json           # Extracted teacher schedule and group data
└── tsconfig.json                # TypeScript compiler options
```

---

## Root Config Files

| File | Description |
|------|-------------|
| **`.gitignore`** | Ignores `node_modules/`, `.next/`, `.env*`, `.vercel`, build artifacts, debug logs, and TypeScript build info. |
| **`package.json`** | Project manifest (name: `huina`, v0.1.0). **Dependencies**: `next@16.1.6`, `react@19.2.3`, `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react` (icons), `sonner` (toasts), `clsx`, `tailwind-merge`, `uuid`, `dotenv`. **Dev deps**: `tailwindcss@4`, `@tailwindcss/postcss`, `typescript@5`, `eslint`, `eslint-config-next`. **Scripts**: `dev`, `build`, `start`, `lint`. |
| **`tsconfig.json`** | Targets ES2017, strict mode, bundler module resolution, JSX react-jsx. Path alias `@/*` → `./src/*`. |
| **`next.config.ts`** | Adds comprehensive HTTP security headers to all routes: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` (HSTS), `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`, and a `Content-Security-Policy` that restricts sources and allows Supabase + Google Fonts connections. |
| **`eslint.config.mjs`** | Flat ESLint config using `eslint-config-next` presets (core-web-vitals + TypeScript). Ignores `.next/`, `out/`, `build/`. |
| **`postcss.config.mjs`** | Registers the `@tailwindcss/postcss` plugin (Tailwind CSS v4 integration). |
| **`next-env.d.ts`** | Auto-generated TypeScript declarations for Next.js. |
| **`README.md`** | Project readme (1.4 KB). |
| **`teachers_data.json`** | Static data file extracted from PDF schedule containing teacher disciplines and groups. |

---

## `lib/` — Shared Types

| File | Description |
|------|-------------|
| **`types.ts`** | Defines three TypeScript interfaces: **`Professor`** (`id`, `name`, `department`, `is_approved`, `created_at`), **`Rating`** (`id`, `professor_id`, `user_fingerprint`, `teaching_score`, `proctoring_score`), and **`ProfessorWithRating`** (extends `Professor` with `avg_teaching_score`, `avg_proctoring_score`). |

---

## `public/` — Static Assets

| File | Description |
|------|-------------|
| **`file.svg`** | File icon (Next.js default). |
| **`globe.svg`** | Globe icon (Next.js default). |
| **`next.svg`** | Next.js logo. |
| **`vercel.svg`** | Vercel logo. |
| **`window.svg`** | Window icon (Next.js default). |

---

## `scripts/` — Utility Scripts

| File | Description |
|------|-------------|
| **`generate_normalization_sql.js`** | Generates SQL statements for normalizing professor data and merging duplicates by analyzing fuzzy matches. |
| **`import_professors.ts`** | Bulk import script that reads a `professors.csv` file (expected columns: `name`, `department`) and inserts rows into the `professors` table via Supabase. Uses the service role key (falls back to anon key with a warning). Auto-approves imported professors (`is_approved: true`). Loads env vars from `.env.local`. |

---

## `src/` — Application Source Code

```
src/
├── app/                         # Next.js App Router pages & actions
│   ├── admin/
│   │   └── page.tsx             # Admin dashboard page
│   ├── groups/
│   │   └── page.tsx             # Groups finder page
│   ├── privacy/
│   │   └── page.tsx             # Privacy policy
│   ├── terms/
│   │   └── page.tsx             # Terms of service
│   ├── actions.ts               # Server actions (all business logic)
│   ├── globals.css              # Global styles & Tailwind imports
│   ├── icon.svg                 # Application icon
│   ├── layout.tsx               # Root layout component
│   └── page.tsx                 # Home page (professor ratings list)
├── components/                  # React components
│   ├── layout/
│   │   ├── Header.tsx           # Site header
│   │   └── Footer.tsx           # Site footer
│   ├── ui/
│   │   └── StarRating.tsx       # Reusable star-rating display
│   ├── GroupPageClient.tsx      # Client logic for groups page
│   ├── InfoModal.tsx            # Modal for displaying information
│   ├── ProfessorTable.tsx       # Main professor ratings table
│   ├── RateModal.tsx            # Modal for submitting a rating
│   ├── SuggestModal.tsx         # Modal for suggesting a new professor
│   └── ThemeProvider.tsx        # Next-themes provider
└── lib/                         # Supabase client utilities
    ├── supabase.ts              # Browser-side Supabase client
    └── supabase-server.ts       # Server-side Supabase clients
```

### `src/app/` — Pages & Server Actions

| File | Description |
|------|-------------|
| **`layout.tsx`** | Root layout. Loads the **Inter** font from Google Fonts, applies it with `antialiased`. Includes the **Sonner** `<Toaster />` for toast notifications. Sets page metadata: title "Professor Ratings", description "Rate and review professors". |
| **`globals.css`** | Imports Tailwind CSS (`@import "tailwindcss"`). Defines CSS custom properties `--background: #FFFFFF`, `--foreground: #37352F` (dark charcoal). Registers Tailwind theme inline tokens for colors and `font-sans: Inter`. |
| **`page.tsx`** | **Home page** (server component). Calls the `get_professors_with_ratings` Supabase RPC, filters to approved professors only, and renders `<ProfessorTable>`. Caches for 60 seconds (`revalidate = 60`) to prevent DoS via excessive page loads. |
| **`icon.svg`** | Site application icon. |
| **`groups/page.tsx`** | **Groups page** (server component). Displays teacher schedule data and allows users to find their groups. |
| **`privacy/page.tsx`** | Privacy policy page. |
| **`terms/page.tsx`** | Terms of service page. |

### `src/app/admin/` — Admin Dashboard

| File | Description |
|------|-------------|
| **`page.tsx`** | **Admin dashboard** (client component, 268 lines). Features: email/password login via Supabase Auth, session management, sortable table of pending (unapproved) professor suggestions, approve/reject actions. Uses server actions (`approveProfessor`, `rejectProfessor`, `fetchPendingProfessors`) for all data mutations. Includes sort by name/department/date, logout functionality, and toast feedback. |

### `src/app/actions.ts` — Server Actions (328 lines)

The core business logic file. All mutations go through these `'use server'` functions, which run on the server and can't be bypassed by the client.

| Function | Description |
|----------|-------------|
| **`cleanupRateLimitMap`** | Periodically cleans up expired rate-limit entries (every 60s) to prevent memory leaks. |
| **`checkRateLimit`** | Sliding-window rate limiter using an in-memory `Map`. Checks if `key` has exceeded `maxRequests` within `windowMs`. |
| **`getClientFingerprint`** | Hashes the request IP (from `x-forwarded-for` or `x-real-ip` headers) using SHA-256 for anonymous identity tracking. |
| **`verifyAdmin`** | Authenticates the current user via Supabase session and checks if their email is in the `ADMIN_EMAILS` environment variable. |
| **`validateName`** | Validates a professor name: 2–100 characters, allows letters/spaces/hyphens/periods/apostrophes. Returns cleaned (trimmed) name. |
| **`submitRating`** | Submits a teaching and/or proctoring rating. Rate limited to **5 per minute** per IP. Validates UUID format, score range (1–5 or null), uses service role key to insert/upsert into `ratings` table. |
| **`suggestProfessor`** | Suggests a new professor. Rate limited to **3 per minute** per IP. Validates name, checks for near-exact duplicates, forces `is_approved = false`. Uses service role key for insert. |
| **`approveProfessor`** | Admin-only. Validates UUID, verifies admin, updates `is_approved` to `true` via service role key. |
| **`rejectProfessor`** | Admin-only. Validates UUID, verifies admin, deletes the professor record via service role key. |
| **`fetchPendingProfessors`** | Admin-only. Returns all unapproved professors (`is_approved = false`), ordered by creation date descending. |

### `src/components/` — React Components

| File | Description |
|------|-------------|
| **`ProfessorTable.tsx`** | Main data table component (200 lines, client component). Displays professors with sortable columns: Name, Teaching rating, Proctoring rating. Each row shows star ratings and a "Rate" button. Supports sorting by name, teaching, proctoring, and count in ascending/descending order. Includes a "Suggest a Professor" button. Opens `RateModal` and `SuggestModal` as needed. Refreshes data via `router.refresh()` after successful actions. |
| **`RateModal.tsx`** | Modal dialog (134 lines) for submitting a rating. Presents two 5-star selectors (Teaching, Proctoring). At least one category must be rated. Calls `submitRating` server action. Shows loading state and toast feedback. |
| **`SuggestModal.tsx`** | Modal dialog (85 lines) for suggesting a new professor. Simple text input for name (max 100 chars). Calls `suggestProfessor` server action. Shows loading state and toast feedback. |
| **`InfoModal.tsx`** | Informational modal dialog for providing additional context or details to users. |
| **`GroupPageClient.tsx`** | Client component for the groups page, managing state and interactions for searching and filtering groups. |
| **`ThemeProvider.tsx`** | Next-themes provider component for enabling light and dark modes across the app. |
| **`layout/Header.tsx`** | Site header providing navigation and branding. |
| **`layout/Footer.tsx`** | Site footer with links to privacy, terms, and copyright information. |

### `src/components/ui/` — UI Primitives

| File | Description |
|------|-------------|
| **`StarRating.tsx`** | Display-only star rating component (53 lines). Renders 5 stars with fractional fill (via CSS `overflow: hidden` clipping). Uses HSL color mapping: rating 1 = red → rating 5 = green. Unrated (0) shows gray. Uses Lucide `Star` icon at 16px. |

### `src/lib/` — Supabase Client Utilities

| File | Description |
|------|-------------|
| **`supabase.ts`** | **Browser-side** Supabase client (42 lines). Creates a `@supabase/ssr` browser client using public env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Provides `getSupabase()` (lazy singleton) and a deprecated `supabase` named export that throws on accidental server-side usage via a `Proxy`. |
| **`supabase-server.ts`** | **Server-side** Supabase clients (59 lines). `createServerSupabaseClient()` — creates a cookie-aware server client for Server Components/Actions (uses `@supabase/ssr`). `createAdminClient()` — creates a service-role client that bypasses RLS, requires `SUPABASE_SERVICE_ROLE_KEY` env var. |

---

## `supabase/` — Database Schema & Migrations

| File | Description |
|------|-------------|
| **`schema.sql`** | **Original schema** (91 lines). Creates `professors` table (id, name, department, is_approved, created_at) and `ratings` table (id, professor_id, user_fingerprint, teaching 1–5, proctoring 1–5, unique per professor+fingerprint). Enables RLS with policies for read/insert/update/delete. Defines `get_professors_with_ratings()` RPC function that returns professors with averaged ratings. |
| **`approval_updates.sql`** | **Migration** (55 lines). Adds admin read access for all professors (including unapproved), admin delete policy, and updates the RPC function to use correct column names (`teaching`/`proctoring` instead of legacy `teaching_score`/`proctoring_score`). |
| **`rating_updates.sql`** | **Migration** (51 lines). Makes `teaching` and `proctoring` columns nullable to support partial ratings (rate only one category). Updates constraints to allow NULL or range 1–5. Updates the RPC to also return `teaching_count` and `proctoring_count`. |
| **`security_fixes.sql`** | **Security hardening migration** (104 lines). Forces `is_approved = false` on INSERT (prevents bypass). Restricts UPDATE/DELETE to authenticated users. Removes public INSERT on ratings (all inserts via service role). Hides `user_fingerprint` from public by creating a `ratings_public` view. Updates RPC to use `SECURITY DEFINER`. |
| **`consolidated_migration.sql`** | **Authoritative consolidated migration** (150 lines). Single file that creates the correct schema from scratch. Drops all old policies, creates finalised RLS policies, defines the `ratings_public` view, and creates the `get_professors_with_ratings()` RPC with `SECURITY DEFINER` and `SET search_path = public` for injection protection. This is the recommended migration to run for new deployments. |
| **`add_aitu_verified.sql`** | Migration to add an `aitu_verified` column or similar verification badge to professor records. |
| **`add_tags.sql`** | Migration to support tags or categories for professors. |
| **`cleanup_professors.sql`** | Script for cleaning up temporary or bad professor data. |
| **`find_fuzzy_duplicates.sql`** | Script to identify potential duplicate professor records based on fuzzy string matching. |
| **`execute_manual_merges.sql`** | Runs manual merge operations for specific duplicate professor records. |
| **`merge_professors.sql`** | Utility functions/queries for merging duplicate professor records into one. |
| **`merge_3_duplicates.sql`** | Specific script targeting merging of 3 duplicates into a single record. |

---

## Environment Variables Required

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous (public) API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key (bypasses RLS) |
| `ADMIN_EMAILS` | Server only | Comma-separated list of admin email addresses |
