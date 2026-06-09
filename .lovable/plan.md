This is a large bundle. I'll ship it in one coordinated pass, but want to confirm scope before touching the database (5 new tables + storage bucket).

## What I'll build

### New features (1–7)
1. **Expenses & Cash Flow** — `/expenses` route, new `expenses` table (amount, category, date, method, notes), category breakdown chart, monthly net cash flow (income − expenses) on dashboard.
2. **Net Worth History** — daily snapshot of total assets stored in existing `snapshots` table, new line chart on dashboard + dedicated section in `/charts` showing 30/90/365-day trend with delta %.
3. **AI Financial Assistant** — floating chat panel (bottom-right on desktop, full-screen sheet on mobile) powered by Lovable AI Gateway (`google/gemini-2.5-flash`, free). Sends user's portfolio summary as system context so it can answer "how am I doing?", "where should I cut?", etc. Implemented as a `createServerFn` calling the AI gateway.
4. **Budgets** — new `budgets` table (category, monthly_limit). `/budgets` route with progress bars vs current month's expenses, burn-rate %, over-budget warnings.
5. **Future Projection Simulator** — `/projections` route. Pure-client compound growth calculator: inputs (current portfolio, monthly contribution, annual return %, years). Renders line chart + table of milestones (1y, 5y, 10y, 20y).
6. **Recurring Transactions** — new `recurring` table (type income/expense, amount, source/category, frequency, next_run, active). Background "process due" runs on app load (client-side, idempotent by next_run advancement) — auto-creates the income/expense rows when due.
7. **Document Vault** — new private storage bucket `documents` + `documents` table (name, file_path, category, size). `/vault` route with upload, list, download, delete. Per-user folders enforced by RLS.

### Settings upgrades
- **Avatar upload** → `avatars` public storage bucket, image uploader, writes `profiles.avatar_url`.
- **Phone number** → new `profiles.phone` column + input field.

### Navigation
- **Mobile bottom tab bar** showing the 5 primary tabs: Dashboard, Investments, Expenses, AI Assistant, Settings. Visible only on screens < `md`. Existing sidebar stays for desktop.

### Landing page (Netflix-style)
Rebuild `/` (currently auth-gated redirect / placeholder):
- Full-bleed dark hero with large bold headline + email/CTA capture → routes to `/auth`.
- Horizontal scrolling "rows" of feature cards (Investments, Goals, Expenses, AI Assistant, Vault) with hover-zoom card effect.
- Sticky transparent → solid header on scroll.
- FAQ accordion section + footer.
- Reuses our design tokens (no Netflix red — keeps our primary).

### App logo
Generate a premium transparent PNG logo (wealth/upward-trend mark) → wire into sidebar header, landing nav, favicon, and OG image.

## Technical notes
- 5 new tables (`expenses`, `budgets`, `recurring`, `documents`) + `profiles.phone` column + 2 storage buckets (`avatars` public, `documents` private), all with RLS scoped to `auth.uid()`.
- AI assistant uses `LOVABLE_API_KEY` (already set) via server function — no new secrets.
- Net worth snapshot writes once per day per user, triggered client-side after dashboard loads (cheap upsert by date).

## Out of scope for this pass
Email automation, advanced AI tool-use (function calling), document OCR — say the word and I'll add later.

**Approve to proceed?** Once approved I'll run the migration first (you'll review SQL), then push all code in parallel.