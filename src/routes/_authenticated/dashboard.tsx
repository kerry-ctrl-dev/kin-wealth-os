import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Wallet,
  Activity,
  Droplets,
  ShieldAlert,
  TrendingUp,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Target as TargetIcon,
  BellRing,
  FileDown,
  Sparkles,
  Flame,
  Home as HomeIcon,
  Coins,
} from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { MetricCard } from "@/components/MetricCard";
import { AllocationDonut } from "@/components/AllocationDonut";
import {
  assetsQuery,
  incomeQuery,
  alertsQuery,
  goalsQuery,
  profileQuery,
  remindersQuery,
  expensesQuery,
  snapshotsQuery,
  personalAssetsQuery,
  loansQuery,
} from "@/lib/queries";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  allocationPercents,
  byCategory,
  CATEGORY_LABEL,
  computeRisk,
  computeRoi,
  fmtKES,
  fmtPct,
  liquidityRatio,
  totalIncome,
  totalValue,
  type AssetCategory,
} from "@/lib/finance";
import {
  greetByHour,
  dailyMotivation,
  computeStreak,
  disciplineScore,
  wealthRating,
} from "@/lib/personalization";
import {
  netWorth,
  totalAvailableCash,
  totalLoansOutstanding,
  personalAssetsValue,
} from "@/lib/balance";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Wealth OS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const assets = useQuery(assetsQuery());
  const income = useQuery(incomeQuery());
  const alerts = useQuery(alertsQuery());
  const goals = useQuery(goalsQuery());
  const profile = useQuery(profileQuery());
  const reminders = useQuery(remindersQuery());
  const expenses = useQuery(expensesQuery());
  const snapshots = useQuery(snapshotsQuery());
  const personalAssets = useQuery(personalAssetsQuery());
  const loans = useQuery(loansQuery());

  const a = assets.data ?? [];
  const i = income.data ?? [];
  const pa = personalAssets.data ?? [];
  const ln = loans.data ?? [];
  const exp = expenses.data ?? [];
  const total = totalValue(a);
  const nw = netWorth(a, pa, ln);
  const availableCash = totalAvailableCash(i, a, exp);
  const debt = totalLoansOutstanding(ln);
  const personalVal = personalAssetsValue(pa);
  const invested = totalIncome(i);
  const roi = computeRoi(a, i);
  const liq = liquidityRatio(a);
  const risk = computeRisk(a);
  const cats = byCategory(a);
  const allocation = allocationPercents(a);

  const greeting = useMemo(
    () => greetByHour(profile.data?.full_name ?? "there"),
    [profile.data?.full_name],
  );
  const motivation = useMemo(() => dailyMotivation(new Date()), []);
  const streak = computeStreak(i.map((x) => x.date));
  const goalsList = goals.data ?? [];
  const avgGoalProgress = goalsList.length
    ? goalsList.reduce((s, g) => s + Math.min(1, Number(g.current) / (Number(g.target) || 1)), 0) /
      goalsList.length
    : 0;
  const reminderRows = reminders.data ?? [];
  const reminderRate = reminderRows.length
    ? reminderRows.filter((r) => r.completed).length / reminderRows.length
    : 1;
  const stocksConc = total ? cats.STOCKS / total : 0;
  const score = disciplineScore({
    streakMonths: streak,
    liquidityRatio: liq,
    avgGoalProgress,
    reminderCompletionRate: reminderRate,
    stocksConcentration: stocksConc,
  });
  const dueReminders = reminderRows.filter(
    (r) => !r.completed && new Date(r.next_due) <= new Date(Date.now() + 7 * 86400_000),
  );

  const now = new Date();
  const monthExp = (expenses.data ?? [])
    .filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, r) => s + Number(r.amount), 0);
  const monthInc = i
    .filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, r) => s + Number(r.amount), 0);
  const netFlow = monthInc - monthExp;
  const alertCount = alerts.data?.length ?? 0;
  const actionItems = [
    {
      label: "Monthly net flow",
      value: fmtKES(netFlow),
      tone: netFlow >= 0 ? "text-[color:var(--success)]" : "text-[color:var(--danger)]",
      helper: netFlow >= 0 ? "Healthy buffer this month" : "Expenses are ahead of income",
    },
    {
      label: "Upcoming reminders",
      value: `${dueReminders.length}`,
      tone: "text-foreground",
      helper:
        dueReminders.length > 0 ? "Tasks due within 7 days" : "Nothing urgent on your calendar",
    },
    {
      label: "Active alerts",
      value: `${alertCount}`,
      tone: alertCount > 0 ? "text-[color:var(--warning)]" : "text-[color:var(--success)]",
      helper:
        alertCount > 0 ? "Portfolio items need attention" : "Portfolio currently looks stable",
    },
  ] as const;
  const trend = (snapshots.data ?? [])
    .slice(-30)
    .map((s) => ({ d: new Date(s.date).toLocaleDateString(), v: Number(s.total_assets) }));

  // Snapshot on dashboard load (best-effort, debounced via hash key)
  useEffect(() => {
    if (!assets.data || !income.data) return;
    const key = `snap:${total}:${roi.toFixed(2)}:${liq.toFixed(3)}:${risk}`;
    if (sessionStorage.getItem("lastSnap") === key) return;
    sessionStorage.setItem("lastSnap", key);
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      supabase
        .from("snapshots")
        .insert({
          user_id: uid,
          total_assets: total,
          liquidity_ratio: liq,
          roi,
          risk_level: risk,
        })
        .then(() => {});
    });
  }, [assets.data, income.data, total, roi, liq, risk]);

  const recent = i.slice(0, 5);

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Dashboard"
        sub="A cleaner command center for your money, portfolio, and next actions."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="fintech-card relative overflow-hidden p-6 sm:p-7">
          <div
            className="absolute inset-0 -z-10 opacity-35"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Today
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {greeting.text} <span>{greeting.emoji}</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                "{motivation}"
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ScorePill
                label={`Wealth · ${wealthRating(score.score).tier}`}
                value={`${wealthRating(score.score).value}`}
              />
              <ScorePill
                label="Streak"
                value={`${streak} mo`}
                icon={streak >= 3 ? <Flame className="h-3.5 w-3.5" /> : null}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <OverviewStat label="Net worth" value={fmtKES(nw)} helper="Your assets minus debt" />
            <OverviewStat
              label="Available cash"
              value={fmtKES(availableCash)}
              helper="Ready to allocate"
            />
            <OverviewStat
              label="This month"
              value={fmtKES(netFlow)}
              helper={netFlow >= 0 ? "Positive cash flow" : "Negative cash flow"}
              tone={netFlow >= 0 ? "success" : "danger"}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-5">
              <Link to="/portfolio">Review portfolio</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-border/70 bg-background/45 px-5"
            >
              <Link to="/expenses">Tidy up spending</Link>
            </Button>
          </div>
        </div>

        <div className="fintech-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold tracking-tight">At a glance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The signals worth checking before you dive deeper.
              </p>
            </div>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-5 space-y-3">
            {actionItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/80 bg-background/35 p-4"
              >
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  {item.label}
                </div>
                <div className={`mt-1 metric-value text-2xl font-semibold ${item.tone}`}>
                  {item.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{item.helper}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <QuickActions />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="fintech-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold tracking-tight">Net worth trend</h2>
            <span className="text-xs text-muted-foreground">Last {trend.length} snapshots</span>
          </div>
          {trend.length > 1 ? (
            <div className="h-44">
              <ResponsiveContainer>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" hide />
                  <YAxis hide domain={["dataMin", "dataMax"]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                    }}
                    formatter={(v: number) => fmtKES(v)}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#nw)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6">
              Snapshots are captured automatically — your trend will appear here as your portfolio
              evolves.
            </p>
          )}
        </div>
        <div className="fintech-card p-6">
          <h2 className="font-semibold tracking-tight">Cash flow this month</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-background/40 border border-border p-3">
              <div className="text-muted-foreground text-xs">Income</div>
              <div className="metric-value font-semibold mt-1">{fmtKES(monthInc)}</div>
            </div>
            <div className="rounded-md bg-background/40 border border-border p-3">
              <div className="text-muted-foreground text-xs">Expenses</div>
              <div className="metric-value font-semibold mt-1">{fmtKES(monthExp)}</div>
            </div>
          </div>
          <div
            className="mt-3 rounded-md p-3 border"
            style={{
              borderColor:
                netFlow >= 0
                  ? "color-mix(in oklab, var(--success) 40%, transparent)"
                  : "color-mix(in oklab, var(--danger) 40%, transparent)",
            }}
          >
            <div className="text-xs text-muted-foreground">Net</div>
            <div
              className="metric-value text-2xl font-semibold"
              style={{ color: netFlow >= 0 ? "var(--success)" : "var(--danger)" }}
            >
              {fmtKES(netFlow)}
            </div>
          </div>
          <Link to="/expenses" className="text-xs text-primary mt-3 inline-flex items-center gap-1">
            Manage expenses →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Total Assets"
          value={fmtKES(total)}
          sub={<span>Invested: {fmtKES(invested)}</span>}
          icon={<Wallet className="h-4 w-4" />}
        />
        <MetricCard
          label="Net Worth"
          value={fmtKES(nw)}
          sub={`Invest ${fmtKES(total)} + Items ${fmtKES(personalVal)} − Debt ${fmtKES(debt)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label="ROI"
          value={
            <span className="inline-flex items-center gap-1">
              {roi >= 0 ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownRight className="h-5 w-5" />
              )}
              {fmtPct(roi, 2)}
            </span>
          }
          tone={roi >= 0 ? "success" : "danger"}
          sub="vs. capital invested"
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="Liquidity"
          value={fmtPct(liq * 100)}
          tone={liq < 0.3 ? "danger" : liq < 0.5 ? "warning" : "success"}
          sub="Cash + MMF / Total"
          icon={<Droplets className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard
          label="Available cash"
          value={fmtKES(availableCash)}
          sub="Income not yet allocated"
          icon={<Wallet className="h-4 w-4" />}
          tone={availableCash <= 0 ? "warning" : "success"}
        />
        <MetricCard
          label="Personal assets"
          value={fmtKES(personalVal)}
          sub={`${pa.length} items`}
          icon={<HomeIcon className="h-4 w-4" />}
        />
        <MetricCard
          label="Loans outstanding"
          value={fmtKES(debt)}
          sub={`${ln.filter((l) => l.status !== "REPAID").length} active`}
          icon={<Coins className="h-4 w-4" />}
          tone={debt > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="fintech-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-semibold tracking-tight">Portfolio Allocation</h2>
              <p className="text-xs text-muted-foreground">Distribution across asset classes</p>
            </div>
            <RiskBadge risk={risk} />
          </div>
          <div className="grid sm:grid-cols-5 items-center gap-4">
            <div className="sm:col-span-2">
              <AllocationDonut data={allocation} />
            </div>
            <div className="sm:col-span-3 space-y-2">
              {(Object.keys(cats) as AssetCategory[])
                .filter((c) => cats[c] > 0)
                .map((c) => {
                  const pct = total ? (cats[c] / total) * 100 : 0;
                  return (
                    <div key={c}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              background: `var(--chart-${["MMF", "STOCKS", "REITS", "CASH", "REAL_ESTATE"].indexOf(c) + 1})`,
                            }}
                          />
                          {CATEGORY_LABEL[c]}
                        </span>
                        <span className="metric-value text-muted-foreground">
                          {fmtKES(cats[c])} · {fmtPct(pct)}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5 mt-1" />
                    </div>
                  );
                })}
              {total === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add income on the Income page to bootstrap your allocation.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="fintech-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold tracking-tight flex items-center gap-2">
              <Bell className="h-4 w-4" /> Alerts
            </h2>
            <span className="text-xs text-muted-foreground">{alerts.data?.length ?? 0} total</span>
          </div>
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {(alerts.data ?? []).slice(0, 6).map((al) => (
              <div
                key={al.id}
                className="text-sm border border-border rounded-md p-3 bg-background/40"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={
                      al.severity === "DANGER"
                        ? "text-[color:var(--danger)] text-xs font-semibold"
                        : al.severity === "WARNING"
                          ? "text-[color:var(--warning)] text-xs font-semibold"
                          : "text-muted-foreground text-xs font-semibold"
                    }
                  >
                    {al.severity} · {al.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(al.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 leading-snug">{al.message}</p>
              </div>
            ))}
            {(alerts.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No alerts. Healthy portfolio.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="fintech-card p-6">
          <h2 className="font-semibold tracking-tight mb-3">Recent Income</h2>
          <div className="divide-y divide-border">
            {recent.map((r) => (
              <div key={r.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{r.source}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="metric-value">{fmtKES(Number(r.amount))}</div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No income yet.</p>}
          </div>
        </div>

        <div className="fintech-card p-6">
          <h2 className="font-semibold tracking-tight mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Portfolio Health
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Risk level</span>
              <span className="font-semibold">{risk}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Liquidity ratio</span>
              <span>{fmtPct(liq * 100)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Stocks exposure</span>
              <span>{fmtPct(total ? (cats.STOCKS / total) * 100 : 0)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Active goals</span>
              <span>{goals.data?.length ?? 0}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Total transactions</span>
              <span>{i.length}</span>
            </li>
          </ul>
          {(score.strengths.length > 0 || score.weaknesses.length > 0) && (
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="uppercase tracking-widest text-muted-foreground mb-1">
                  Strengths
                </div>
                <ul className="space-y-1">
                  {score.strengths.slice(0, 3).map((s) => (
                    <li key={s} className="text-[color:var(--success)]">
                      ✓ {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="uppercase tracking-widest text-muted-foreground mb-1">Improve</div>
                <ul className="space-y-1">
                  {score.weaknesses.slice(0, 3).map((s) => (
                    <li key={s} className="text-[color:var(--warning)]">
                      → {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {dueReminders.length > 0 && (
        <div className="fintech-card p-6">
          <h2 className="font-semibold tracking-tight mb-3 flex items-center gap-2">
            <BellRing className="h-4 w-4" /> Upcoming reminders
          </h2>
          <div className="space-y-2">
            {dueReminders.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between text-sm border border-border rounded-md p-3"
              >
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.kind} · {r.frequency}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.next_due).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/65 px-3 py-1.5 text-xs backdrop-blur">
      <span className="uppercase tracking-[0.24em] text-muted-foreground">{label}</span>
      <span className="font-semibold metric-value flex items-center gap-1">
        {icon}
        {value}
      </span>
    </div>
  );
}

function QuickActions() {
  const actions = [
    {
      to: "/income",
      label: "Add Income",
      icon: Plus,
      detail: "Capture a salary, payment, or side hustle",
    },
    {
      to: "/portfolio",
      label: "Add Investment",
      icon: Wallet,
      detail: "Update holdings and allocation",
    },
    {
      to: "/personal-assets",
      label: "Add Asset",
      icon: HomeIcon,
      detail: "Track property and valuables",
    },
    { to: "/loans", label: "Record Loan", icon: Coins, detail: "Log debt, lending, or repayments" },
    { to: "/goals", label: "Create Goal", icon: TargetIcon, detail: "Set a new savings target" },
    {
      to: "/reports",
      label: "Reports",
      icon: FileDown,
      detail: "Export a polished financial snapshot",
    },
  ] as const;
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Quick actions</h2>
        <p className="text-sm text-muted-foreground">
          Jump into the updates people make most often.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((a) => (
          <Button
            key={a.to}
            asChild
            variant="ghost"
            className="fintech-card h-auto justify-start rounded-2xl p-0 hover:bg-card/80"
          >
            <Link
              to={a.to}
              className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left"
            >
              <span>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <a.icon className="h-4 w-4 text-primary" />
                  {a.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {a.detail}
                </span>
              </span>
              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

function OverviewStat({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "success" | "danger";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-[color:var(--success)]",
    danger: "text-[color:var(--danger)]",
  }[tone];

  return (
    <div className="rounded-2xl border border-border/80 bg-background/35 p-4 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className={`mt-1 metric-value text-2xl font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: "LOW" | "MEDIUM" | "HIGH" }) {
  const tone =
    risk === "HIGH" ? "var(--danger)" : risk === "MEDIUM" ? "var(--warning)" : "var(--success)";
  return (
    <span
      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border"
      style={{ color: tone, borderColor: `color-mix(in oklab, ${tone} 50%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
      {risk} risk
    </span>
  );
}
