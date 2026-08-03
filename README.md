# MalinGu — My Wealth, My Way

MalinGu (Swahili: *Mali Yangu* — “My Wealth”) is a premium personal wealth operating system built for Kenyan investors. It helps students, young professionals, and first-time investors track income, allocate capital across local instruments (MMF, NSE, REITs, T-bills), set goals, manage loans, and make smarter financial decisions with a Kenyan-market AI copilot.

![MalinGu](https://malingu.lovable.app)

---

## What it does

- **Income tracking** — Record salary, side hustles, allowances, and other cash inflows. Toggle automatic allocation into your chosen asset buckets.
- **Smart allocation** — Distribute income across Cash / Savings (MMF), NSE stocks, REITs, and bonds with a single tap. Keep the rest as free cash.
- **Investment portfolio** — Track MMF, NSE, REIT, bond, cash, and other holdings. Pick from real Kenyan instruments like CIC MMF, Safaricom, ILAM Fahari I-REIT, and more.
- **Goal-based savings** — Set savings goals, track progress, and contribute directly from income or cash.
- **Loans manager** — Record money borrowed or lent, calculate interest (daily, weekly, monthly, yearly), and generate loanee reports with contact details and payment instructions.
- **Personal assets** — Track vehicles, household items, electronics, and other real assets alongside your liquid investments.
- **Expenses & budgets** — Log expenses, categorize spending, and set monthly budgets with burn-rate warnings.
- **Financial calendar** — Visualize income, reminders, and due dates on a calendar.
- **Reminders & alerts** — Schedule reminders and configure liquidity, goal, and rebalancing alerts.
- **Reports & exports** — Generate CSV and PDF reports for any custom date range, including net-worth, debt, and personalized advice summaries.
- **Ask Aria** — A persistent AI financial copilot grounded in Kenyan-market context (CBK rates, MMF providers, taxes, inflation). Aria remembers your goals, gives proactive insights, and runs an onboarding wizard to capture your risk profile and holdings.
- **Appearance studio** — Choose light, dark, or system theme; pick accent colors; change font pairing; adjust widget density and dashboard defaults.

---

## Tech stack

- **Framework** — [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7)
- **Backend & Auth** — Lovable Cloud / Supabase (Postgres + Auth + Storage)
- **Styling** — Tailwind CSS v4 + shadcn/ui components
- **Charts** — Recharts
- **AI** — Lovable AI Gateway with `google/gemini-2.5-flash`
- **PDF reports** — jsPDF
- **MCP integrations** — `@lovable.dev/mcp-js` for agent tools

---

## Project structure

```text
src/
  components/          # Reusable UI components (cards, charts, sidebar, widgets)
  hooks/               # Custom React hooks (avatar, mobile detection)
  integrations/        # Supabase clients, Lovable integrations
  lib/                 # Finance logic, server functions, reports, AI, MCP tools
  routes/              # TanStack Start file routes
  server.ts            # Error handling & server entry
  start.ts             # App start config
  styles.css           # Design tokens, theme, utilities
  router.tsx           # Router setup
whatsapp-clone/        # Standalone legacy demo (not part of the main app)
supabase/              # Supabase config & migrations
```

---

## Key files

| File | Purpose |
|------|---------|
| `src/lib/finance.ts` | Asset categories, allocation math, KES formatting, risk scoring |
| `src/lib/balance.ts` | Net worth, income balance, and debt calculations |
| `src/lib/ai.functions.ts` | Aria AI assistant server function |
| `src/lib/alert-engine.ts` | Alert triggering for liquidity, goals, and rebalancing |
| `src/lib/appearance.ts` | Theme, font, accent color, and density settings |
| `src/lib/personalization.ts` | Wealth score, greeting, and daily motivation |
| `src/lib/loan-report.ts` | Loanee PDF report generation |
| `src/lib/pdf-report.ts` | General financial PDF reports |
| `src/lib/achievements.ts` | Achievement badge definitions (legacy) |
| `src/lib/mcp/index.ts` | Model Context Protocol server definition |
| `src/routes/__root.tsx` | Root layout, theme boot, Toaster, Aria widget |

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
LOVABLE_API_KEY=
```

These are already configured for Lovable Cloud projects.

---

## Local development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev
```

The app runs at `http://localhost:8080`.

---

## Build

```bash
bun run build
```

TanStack Start produces a production bundle optimized for edge deployment.

---

## Database migrations

Migrations live in the Supabase project and are managed through Lovable Cloud. Each new table is created with Row-Level Security (RLS) and scoped to the authenticated user. When you add a new table, always include:

1. `CREATE TABLE public.<table>(...)`
2. `GRANT` statements for `authenticated` and `service_role`
3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
4. `CREATE POLICY ...` scoped to `auth.uid()`

---

## Security notes

- Avatar files are stored in a private storage bucket and resolved via short-lived signed URLs.
- Server functions that touch sensitive data use `requireSupabaseAuth` middleware.
- MCP tools authenticate via OAuth and forward the user’s bearer token so RLS applies.
- The production `LOVABLE_API_KEY` should be rotated periodically.

---

## License

Private — for the owner of this Lovable project.

---

Built with care in Kenya 🇰🇪 for everyday wealth builders.
