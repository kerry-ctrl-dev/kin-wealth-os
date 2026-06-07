import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Wallet, Activity, Droplets, ShieldAlert, TrendingUp, Bell, ArrowUpRight, ArrowDownRight,
  Plus, Target as TargetIcon, BellRing, FileDown, Sparkles, Flame,
} from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { MetricCard } from "@/components/MetricCard";
import { AllocationDonut } from "@/components/AllocationDonut";
import { assetsQuery, incomeQuery, alertsQuery, goalsQuery, profileQuery, remindersQuery } from "@/lib/queries";
import {
  allocationPercents, byCategory, CATEGORY_LABEL, computeRisk, computeRoi,
  fmtKES, fmtPct, liquidityRatio, totalIncome, totalValue, type AssetCategory,
} from "@/lib/finance";
import { greetByHour, dailyMotivation, computeStreak, disciplineScore } from "@/lib/personalization";
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

  const a = assets.data ?? [];
  const i = income.data ?? [];
  const total = totalValue(a);
  const invested = totalIncome(i);
  const roi = computeRoi(a, i);
  const liq = liquidityRatio(a);
  const risk = computeRisk(a);
  const cats = byCategory(a);
  const allocation = allocationPercents(a);

  const greeting = useMemo(() => greetByHour(profile.data?.full_name ?? "there"), [profile.data?.full_name]);
  const motivation = useMemo(() => dailyMotivation(new Date()), []);
  const streak = computeStreak(i.map((x) => x.date));
  const goalsList = goals.data ?? [];
  const avgGoalProgress = goalsList.length
    ? goalsList.reduce((s, g) => s + Math.min(1, Number(g.current) / (Number(g.target) || 1)), 0) / goalsList.length
    : 0;
  const reminderRows = reminders.data ?? [];
  const reminderRate = reminderRows.length ? reminderRows.filter((r) => r.completed).length / reminderRows.length : 1;
  const stocksConc = total ? cats.STOCKS / total : 0;
  const score = disciplineScore({
    streakMonths: streak,
    liquidityRatio: liq,
    avgGoalProgress,
    reminderCompletionRate: reminderRate,
    stocksConcentration: stocksConc,
  });
  const dueReminders = reminderRows.filter((r) => !r.completed && new Date(r.next_due) <= new Date(Date.now() + 7 * 86400_000));

  // Snapshot on dashboard load (best-effort, debounced via hash key)
  useEffect(() => {
    if (!assets.data || !income.data) return;
    const key = `snap:${total}:${roi.toFixed(2)}:${liq.toFixed(3)}:${risk}`;
    if (sessionStorage.getItem("lastSnap") === key) return;
    sessionStorage.setItem("lastSnap", key);
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      supabase.from("snapshots").insert({
        user_id: uid, total_assets: total, liquidity_ratio: liq, roi, risk_level: risk,
      }).then(() => {});
    });
  }, [assets.data, income.data, total, roi, liq, risk]);

  const recent = i.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="fintech-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30" style={{ background: "var(--gradient-primary)" }} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> Today
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
              {greeting.text} <span>{greeting.emoji}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 italic">"{motivation}"</p>
          </div>
          <div className="flex items-center gap-2">
            <ScorePill label="Discipline" value={`${score.score}/100`} />
            <ScorePill label="Streak" value={`${streak} mo`} icon={streak >= 3 ? <Flame className="h-3.5 w-3.5" /> : null} />
          </div>
        </div>
      </div>

      <QuickActions />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Total Assets"
          value={fmtKES(total)}
          sub={<span>Invested: {fmtKES(invested)}</span>}
          icon={<Wallet className="h-4 w-4" />}
        />
        <MetricCard
          label="Net Worth"
          value={fmtKES(total)}
          sub="All accounts combined"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          label="ROI"
          value={
            <span className="inline-flex items-center gap-1">
              {roi >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
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
              {(Object.keys(cats) as AssetCategory[]).filter((c) => cats[c] > 0).map((c) => {
                const pct = total ? (cats[c] / total) * 100 : 0;
                return (
                  <div key={c}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: `var(--chart-${["MMF","STOCKS","REITS","CASH","REAL_ESTATE"].indexOf(c) + 1})` }} />
                        {CATEGORY_LABEL[c]}
                      </span>
                      <span className="metric-value text-muted-foreground">{fmtKES(cats[c])} · {fmtPct(pct)}</span>
                    </div>
                    <Progress value={pct} className="h-1.5 mt-1" />
                  </div>
                );
              })}
              {total === 0 && (
                <p className="text-sm text-muted-foreground">Add income on the Income page to bootstrap your allocation.</p>
              )}
            </div>
          </div>
        </div>

        <div className="fintech-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold tracking-tight flex items-center gap-2"><Bell className="h-4 w-4" /> Alerts</h2>
            <span className="text-xs text-muted-foreground">{alerts.data?.length ?? 0} total</span>
          </div>
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {(alerts.data ?? []).slice(0, 6).map((al) => (
              <div key={al.id} className="text-sm border border-border rounded-md p-3 bg-background/40">
                <div className="flex items-center justify-between">
                  <span className={
                    al.severity === "DANGER" ? "text-[color:var(--danger)] text-xs font-semibold" :
                    al.severity === "WARNING" ? "text-[color:var(--warning)] text-xs font-semibold" :
                    "text-muted-foreground text-xs font-semibold"
                  }>{al.severity} · {al.type}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(al.date).toLocaleDateString()}</span>
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
                  <div className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()}</div>
                </div>
                <div className="metric-value">{fmtKES(Number(r.amount))}</div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No income yet.</p>}
          </div>
        </div>

        <div className="fintech-card p-6">
          <h2 className="font-semibold tracking-tight mb-3 flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Portfolio Health</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-muted-foreground">Risk level</span><span className="font-semibold">{risk}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Liquidity ratio</span><span>{fmtPct(liq * 100)}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Stocks exposure</span><span>{fmtPct(total ? (cats.STOCKS / total) * 100 : 0)}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Active goals</span><span>{goals.data?.length ?? 0}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Total transactions</span><span>{i.length}</span></li>
          </ul>
          {(score.strengths.length > 0 || score.weaknesses.length > 0) && (
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="uppercase tracking-widest text-muted-foreground mb-1">Strengths</div>
                <ul className="space-y-1">{score.strengths.slice(0, 3).map((s) => <li key={s} className="text-[color:var(--success)]">✓ {s}</li>)}</ul>
              </div>
              <div>
                <div className="uppercase tracking-widest text-muted-foreground mb-1">Improve</div>
                <ul className="space-y-1">{score.weaknesses.slice(0, 3).map((s) => <li key={s} className="text-[color:var(--warning)]">→ {s}</li>)}</ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {dueReminders.length > 0 && (
        <div className="fintech-card p-6">
          <h2 className="font-semibold tracking-tight mb-3 flex items-center gap-2"><BellRing className="h-4 w-4" /> Upcoming reminders</h2>
          <div className="space-y-2">
            {dueReminders.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm border border-border rounded-md p-3">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.kind} · {r.frequency}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(r.next_due).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-full border border-border bg-background/60 backdrop-blur px-3 py-1.5 text-xs flex items-center gap-2">
      <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-semibold metric-value flex items-center gap-1">{icon}{value}</span>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { to: "/income", label: "Add Income", icon: Plus },
    { to: "/portfolio", label: "Add Investment", icon: Wallet },
    { to: "/goals", label: "Create Goal", icon: TargetIcon },
    { to: "/reminders", label: "Set Reminder", icon: BellRing },
    { to: "/charts", label: "Analytics", icon: Activity },
    { to: "/alerts", label: "Alerts", icon: Bell },
  ] as const;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {actions.map((a) => (
        <Button key={a.to} asChild variant="outline" className="justify-start h-auto py-3">
          <Link to={a.to}>
            <a.icon className="h-4 w-4" />
            <span className="text-sm">{a.label}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
}

function RiskBadge({ risk }: { risk: "LOW" | "MEDIUM" | "HIGH" }) {
  const tone = risk === "HIGH" ? "var(--danger)" : risk === "MEDIUM" ? "var(--warning)" : "var(--success)";
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