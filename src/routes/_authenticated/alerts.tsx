import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BellRing, Save, Zap } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_ALERT_PREFS, loadAlertPrefs, saveAlertPrefs, type AlertPrefs } from "@/lib/alert-prefs";
import { evaluateAlerts, syncAlertsToDb } from "@/lib/alert-engine";
import {
  assetsQuery,
  budgetsQuery,
  expensesQuery,
  goalsQuery,
  loansQuery,
  alertsQuery,
} from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({ meta: [{ title: "Alerts — MalinGu" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const [p, setP] = useState<AlertPrefs>(() => loadAlertPrefs());
  const [milestonesText, setMilestonesText] = useState(p.goalMilestones.join(", "));
  const qc = useQueryClient();
  const assets = useQuery(assetsQuery());
  const goals = useQuery(goalsQuery());
  const expenses = useQuery(expensesQuery());
  const budgets = useQuery(budgetsQuery());
  const loans = useQuery(loansQuery());
  const alerts = useQuery(alertsQuery());

  useEffect(() => saveAlertPrefs(p), [p]);

  const preview = useMemo(
    () =>
      evaluateAlerts({
        assets: assets.data ?? [],
        goals: goals.data ?? [],
        expenses: expenses.data ?? [],
        budgets: budgets.data ?? [],
        loans: loans.data ?? [],
      }),
    [p, assets.data, goals.data, expenses.data, budgets.data, loans.data],
  );

  async function runNow() {
    const n = await syncAlertsToDb(preview);
    if (n > 0) {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success(`${n} alert${n === 1 ? "" : "s"} added`);
    } else {
      toast.info("No new alerts to log — you're already up to date.");
    }
  }

  function applyMilestones() {
    const nums = milestonesText
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0 && n <= 100)
      .sort((a, b) => a - b);
    setP((cur) => ({ ...cur, goalMilestones: nums.length ? nums : DEFAULT_ALERT_PREFS.goalMilestones }));
    toast.success("Milestones updated");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <SectionHeading
        title="Alerts & thresholds"
        sub="Get notified in-app when liquidity, goals, budgets or risk cross your triggers."
      />

      <div className="fintech-card p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold"><BellRing className="h-4 w-4 text-primary" /> Enable alerts</h2>
            <p className="text-sm text-muted-foreground mt-1">Master switch — turn off to pause all in-app notifications.</p>
          </div>
          <Switch checked={p.enabled} onCheckedChange={(v) => setP({ ...p, enabled: v })} />
        </div>

        <NumberField
          label="Liquidity floor (%)"
          help="Warn when your liquid share drops below this."
          value={p.liquidityMinPct}
          onChange={(n) => setP({ ...p, liquidityMinPct: n })}
        />
        <NumberField
          label="Category concentration limit (%)"
          help="Warn when any single asset category exceeds this share."
          value={p.stockConcMaxPct}
          onChange={(n) => setP({ ...p, stockConcMaxPct: n })}
        />
        <NumberField
          label="Budget usage warning (%)"
          help="Warn when a category's spend hits this share of its monthly budget."
          value={p.budgetOverPct}
          onChange={(n) => setP({ ...p, budgetOverPct: n })}
        />
        <NumberField
          label="Loan due window (days)"
          help="Warn when an outstanding loan is due within this many days."
          value={p.loanDueDays}
          onChange={(n) => setP({ ...p, loanDueDays: n })}
        />

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Goal milestones (%)</Label>
          <div className="flex gap-2">
            <Input value={milestonesText} onChange={(e) => setMilestonesText(e.target.value)} placeholder="25, 50, 75, 100" />
            <Button variant="outline" onClick={applyMilestones}><Save className="h-4 w-4" /> Apply</Button>
          </div>
          <p className="text-xs text-muted-foreground">Comma-separated percentages. You get one nudge each time a goal crosses one.</p>
        </div>

        <div className="pt-2">
          <Button onClick={runNow} disabled={!p.enabled}><Zap className="h-4 w-4" /> Evaluate now</Button>
        </div>
      </div>

      <div className="fintech-card p-6">
        <h2 className="font-semibold mb-2">Preview ({preview.length})</h2>
        {preview.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing tripping your triggers right now.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {preview.map((t) => (
              <li key={t.key} className="rounded-xl border border-border/70 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.severity} · {t.type}</div>
                <div>{t.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fintech-card p-6">
        <h2 className="font-semibold mb-2">Recent alerts</h2>
        {(alerts.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No alerts yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(alerts.data ?? []).slice(0, 10).map((a) => (
              <li key={a.id} className="rounded-xl border border-border/70 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{a.severity} · {a.type} · {new Date(a.date).toLocaleString()}</div>
                <div>{a.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
      />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}