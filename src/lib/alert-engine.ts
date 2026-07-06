import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { byCategory, liquidityRatio, totalValue } from "./finance";
import { loadAlertPrefs } from "./alert-prefs";

type Asset = Tables<"assets">;
type Goal = Tables<"goals">;
type Expense = Tables<"expenses">;
type Budget = Tables<"budgets">;
type Loan = Tables<"loans">;

type Sev = "INFO" | "WARNING" | "DANGER";
interface Trigger { key: string; type: string; message: string; severity: Sev }

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

export function evaluateAlerts(input: {
  assets: Asset[];
  goals: Goal[];
  expenses: Expense[];
  budgets: Budget[];
  loans: Loan[];
}): Trigger[] {
  const prefs = loadAlertPrefs();
  if (!prefs.enabled) return [];
  const out: Trigger[] = [];
  const monthKey = currentMonthKey();

  // Liquidity
  const liq = liquidityRatio(input.assets) * 100;
  if (input.assets.length > 0 && liq < prefs.liquidityMinPct) {
    out.push({
      key: `liquidity-${monthKey}-${prefs.liquidityMinPct}`,
      type: "liquidity",
      severity: liq < prefs.liquidityMinPct / 2 ? "DANGER" : "WARNING",
      message: `Liquidity ${liq.toFixed(0)}% is below your ${prefs.liquidityMinPct}% floor. Top up cash or MMF.`,
    });
  }

  // Rebalancing / concentration
  const cats = byCategory(input.assets);
  const total = totalValue(input.assets);
  if (total > 0) {
    for (const [c, v] of Object.entries(cats)) {
      const pct = (v / total) * 100;
      if (pct > prefs.stockConcMaxPct) {
        out.push({
          key: `conc-${c}-${monthKey}`,
          type: "rebalance",
          severity: pct > 80 ? "DANGER" : "WARNING",
          message: `${c} concentration is ${pct.toFixed(0)}% (limit ${prefs.stockConcMaxPct}%). Consider rebalancing.`,
        });
      }
    }
  }

  // Goal milestones
  for (const g of input.goals) {
    const pct = (Number(g.current) / (Number(g.target) || 1)) * 100;
    const hit = prefs.goalMilestones.filter((m) => pct >= m).pop();
    if (hit != null) {
      out.push({
        key: `goal-${g.id}-${hit}`,
        type: "goal",
        severity: "INFO",
        message: `Goal "${g.name}" hit ${hit}% (${pct.toFixed(0)}% actual). Keep going!`,
      });
    }
  }

  // Budget over-usage
  const now = new Date();
  const spendByCat = new Map<string, number>();
  for (const e of input.expenses) {
    const d = new Date(e.date);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      spendByCat.set(e.category, (spendByCat.get(e.category) ?? 0) + Number(e.amount));
    }
  }
  for (const b of input.budgets) {
    const spent = spendByCat.get(b.category) ?? 0;
    const pct = (spent / (Number(b.monthly_limit) || 1)) * 100;
    if (pct >= prefs.budgetOverPct) {
      out.push({
        key: `budget-${b.category}-${monthKey}`,
        type: "budget",
        severity: pct >= 100 ? "DANGER" : "WARNING",
        message: `${b.category} spend is ${pct.toFixed(0)}% of its monthly budget.`,
      });
    }
  }

  // Loan due soon
  const horizon = Date.now() + prefs.loanDueDays * 86400_000;
  for (const l of input.loans) {
    const due = (l as unknown as { due_date?: string }).due_date;
    if (!due) continue;
    const dueTs = new Date(due).getTime();
    if (dueTs > 0 && dueTs <= horizon && Number((l as unknown as { amount_outstanding?: number }).amount_outstanding ?? 0) > 0) {
      out.push({
        key: `loan-${l.id}-${prefs.loanDueDays}`,
        type: "loan",
        severity: "WARNING",
        message: `Loan "${(l as unknown as { lender?: string; name?: string }).lender ?? (l as unknown as { name?: string }).name ?? "loan"}" is due within ${prefs.loanDueDays} days.`,
      });
    }
  }

  return out;
}

const RUN_KEY = "malingu:alert-run-keys";
function loadRunKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(RUN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function saveRunKeys(keys: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RUN_KEY, JSON.stringify([...keys].slice(-500)));
}

export async function syncAlertsToDb(triggers: Trigger[]): Promise<number> {
  if (triggers.length === 0) return 0;
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return 0;
  const seen = loadRunKeys();
  const fresh = triggers.filter((t) => !seen.has(t.key));
  if (fresh.length === 0) return 0;
  const rows = fresh.map((t) => ({
    user_id: u.user.id,
    type: t.type,
    message: t.message,
    severity: t.severity,
  }));
  const { error } = await supabase.from("alerts").insert(rows);
  if (error) return 0;
  fresh.forEach((t) => seen.add(t.key));
  saveRunKeys(seen);
  return fresh.length;
}