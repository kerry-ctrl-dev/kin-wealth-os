import type { Tables } from "@/integrations/supabase/types";
import { totalIncome, totalValue, computeRoi, liquidityRatio, byCategory, computeRisk, CATEGORY_LABEL, fmtKES, fmtPct, type AssetCategory } from "./finance";
import { netWorth as calcNetWorth, totalLoansOutstanding, totalLoansReceivable, personalAssetsValue } from "./balance";

type Asset = Tables<"assets">;
type Income = Tables<"income">;
type Goal = Tables<"goals">;
type Expense = Tables<"expenses">;
type Budget = Tables<"budgets">;
type Reminder = Tables<"reminders">;
type Alert = Tables<"alerts">;
type PersonalAsset = Tables<"personal_assets">;
type Loan = Tables<"loans">;

function inRange<T extends { date?: string; created_at?: string }>(rows: T[], field: "date" | "created_at", from: Date, to: Date): T[] {
  return rows.filter((r) => {
    const v = (r as any)[field];
    if (!v) return false;
    const d = new Date(v);
    return d >= from && d <= to;
  });
}

export type ReportPeriod = "daily" | "weekly" | "monthly";

export function periodRange(period: ReportPeriod, ref: Date = new Date()): { from: Date; to: Date; label: string } {
  const to = new Date(ref);
  const from = new Date(ref);
  if (period === "daily") {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to, label: from.toLocaleDateString() };
  }
  if (period === "weekly") {
    const day = from.getDay();
    from.setDate(from.getDate() - day);
    from.setHours(0, 0, 0, 0);
    return { from, to, label: `Week of ${from.toLocaleDateString()}` };
  }
  from.setDate(1);
  from.setHours(0, 0, 0, 0);
  return { from, to, label: from.toLocaleString(undefined, { month: "long", year: "numeric" }) };
}

export interface Report {
  period: ReportPeriod;
  label: string;
  incomeCount: number;
  incomeTotal: number;
  newInvestments: number;
  newInvestmentsValue: number;
  totalAssets: number;
  roi: number;
  liquidity: number;
  risk: string;
  allocation: Array<{ category: AssetCategory; value: number; pct: number }>;
  goalsProgress: Array<{ name: string; pct: number }>;
  insights: string[];
  // Extended
  netWorth: number;
  personalAssetsValue: number;
  loansOutstanding: number;
  loansReceivable: number;
  expensesTotal: number;
  expensesByCategory: Array<{ category: string; value: number }>;
  expensesList: Array<{ date: string; vendor: string; category: string; amount: number }>;
  incomeList: Array<{ date: string; source: string; amount: number }>;
  budgets: Array<{ category: string; limit: number; spent: number; pct: number }>;
  upcoming: Array<{ title: string; due: string; kind: string }>;
  alerts: Array<{ severity: string; message: string; date: string }>;
  creditRemark: string;
  advice: string[];
}

export function buildReport(
  period: ReportPeriod,
  assets: Asset[],
  income: Income[],
  goals: Goal[],
  ref: Date = new Date(),
  extras: {
    expenses?: Expense[];
    budgets?: Budget[];
    reminders?: Reminder[];
    alerts?: Alert[];
    personalAssets?: PersonalAsset[];
    loans?: Loan[];
  } = {},
): Report {
  const { from, to, label } = periodRange(period, ref);
  const incomePeriod = inRange(income, "date", from, to);
  const assetsPeriod = inRange(assets, "created_at", from, to);
  const expenses = extras.expenses ?? [];
  const budgets = extras.budgets ?? [];
  const reminders = extras.reminders ?? [];
  const alerts = extras.alerts ?? [];
  const personalAssets = extras.personalAssets ?? [];
  const loans = extras.loans ?? [];
  const expensesPeriod = inRange(expenses, "date", from, to);
  const cats = byCategory(assets);
  const total = totalValue(assets);
  const allocation = (Object.keys(cats) as AssetCategory[])
    .filter((c) => cats[c] > 0)
    .map((c) => ({ category: c, value: cats[c], pct: total ? (cats[c] / total) * 100 : 0 }));
  const roi = computeRoi(assets, income);
  const liq = liquidityRatio(assets);
  const risk = computeRisk(assets);

  // Expenses by category in period
  const expByCat = new Map<string, number>();
  for (const e of expensesPeriod) expByCat.set(e.category, (expByCat.get(e.category) ?? 0) + Number(e.amount));
  const expensesByCategory = [...expByCat.entries()].map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
  const expensesTotal = expensesPeriod.reduce((s, e) => s + Number(e.amount), 0);

  // Budgets vs spent this period
  const budgetsRows = budgets.map((b) => {
    const spent = expByCat.get(b.category) ?? 0;
    const limit = Number(b.monthly_limit);
    return { category: b.category, limit, spent, pct: limit ? (spent / limit) * 100 : 0 };
  });

  // Upcoming reminders (next 14 days)
  const horizon = new Date(); horizon.setDate(horizon.getDate() + 14);
  const upcoming = reminders
    .filter((r) => !r.completed && new Date(r.next_due) <= horizon)
    .sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime())
    .slice(0, 12)
    .map((r) => ({ title: r.title, due: r.next_due, kind: r.kind }));

  const alertsRecent = alerts.slice(0, 10).map((a) => ({ severity: a.severity, message: a.message, date: a.date }));

  const debt = totalLoansOutstanding(loans);
  const receivable = totalLoansReceivable(loans);
  const nw = calcNetWorth(assets, personalAssets, loans);
  const paValue = personalAssetsValue(personalAssets);

  // Credit & financial advice
  const debtToAssets = total + paValue > 0 ? debt / (total + paValue) : 0;
  let creditRemark: string;
  if (debt === 0) creditRemark = "Excellent credit standing: you currently carry no outstanding debt. Keep this discipline to qualify for the best rates when you do need credit.";
  else if (debtToAssets < 0.2) creditRemark = "Healthy credit standing. Your debt is well below 20% of your asset base — lenders will see you as low-risk.";
  else if (debtToAssets < 0.5) creditRemark = "Manageable credit position. Aim to keep debt under 30% of assets and prioritise paying down the highest-interest balances first.";
  else creditRemark = "Credit risk is elevated — debt exceeds 50% of your asset base. Pause new borrowing, restructure existing loans, and accelerate repayments before adding investments.";

  const advice: string[] = [];
  if (incomePeriod.length === 0) advice.push("Log every shilling of income — even small entries — so allocations and balances stay accurate.");
  if (expensesTotal > incomePeriod.reduce((s, i) => s + Number(i.amount), 0)) advice.push("You spent more than you earned this period. Trim a non-essential category before next cycle.");
  if (liq < 0.3) advice.push("Build a liquid cash/MMF buffer covering at least 3 months of expenses before adding illiquid investments.");
  if (roi < 0) advice.push("Your portfolio ROI is negative — rebalance toward stable instruments (MMF, REITs) until conditions improve.");
  if (debt > 0 && receivable > 0) advice.push("Collect outstanding receivables and use them to retire high-interest debt first.");
  if (goals.length === 0) advice.push("Set at least one financial goal — disciplined contributors hit targets 3× more often.");
  if (allocation.some((a) => a.category === "STOCKS" && a.pct > 60)) advice.push("Reduce single-asset concentration: cap NSE stocks at 40–50% of the portfolio.");
  if (advice.length === 0) advice.push("You're on track. Stay consistent and review allocations monthly.");

  const insights: string[] = [];
  if (incomePeriod.length === 0) insights.push("No income recorded this period — add entries to keep your streak.");
  if (liq < 0.3) insights.push("Liquidity is critically low — top up your MMF buffer.");
  if (roi < 0) insights.push("Portfolio ROI is negative — review allocations.");
  if (allocation.some((a) => a.category === "STOCKS" && a.pct > 60)) insights.push("Stock concentration above 60% — diversify.");
  if (insights.length === 0) insights.push("Portfolio looks healthy. Stay consistent.");

  return {
    period,
    label,
    incomeCount: incomePeriod.length,
    incomeTotal: incomePeriod.reduce((s, i) => s + Number(i.amount), 0),
    newInvestments: assetsPeriod.length,
    newInvestmentsValue: assetsPeriod.reduce((s, a) => s + Number(a.value), 0),
    totalAssets: total,
    roi,
    liquidity: liq * 100,
    risk,
    allocation,
    goalsProgress: goals.map((g) => ({ name: g.name, pct: Math.min(100, (Number(g.current) / (Number(g.target) || 1)) * 100) })),
    insights,
    netWorth: nw,
    personalAssetsValue: paValue,
    loansOutstanding: debt,
    loansReceivable: receivable,
    expensesTotal,
    expensesByCategory,
    expensesList: expensesPeriod.slice(0, 20).map((e) => ({ date: e.date, vendor: e.vendor ?? e.category, category: e.category, amount: Number(e.amount) })),
    incomeList: incomePeriod.slice(0, 20).map((i) => ({ date: i.date, source: i.source, amount: Number(i.amount) })),
    budgets: budgetsRows,
    upcoming,
    alerts: alertsRecent,
    creditRemark,
    advice,
  };
}

export function reportToText(r: Report): string {
  const lines: string[] = [];
  lines.push(`Wealth OS — ${r.period.toUpperCase()} REPORT`);
  lines.push(r.label);
  lines.push("");
  lines.push(`Total Assets: ${fmtKES(r.totalAssets)}`);
  lines.push(`ROI: ${fmtPct(r.roi, 2)} · Liquidity: ${fmtPct(r.liquidity)} · Risk: ${r.risk}`);
  lines.push(`Income this period: ${r.incomeCount} entries totalling ${fmtKES(r.incomeTotal)}`);
  lines.push(`New investments: ${r.newInvestments} worth ${fmtKES(r.newInvestmentsValue)}`);
  lines.push("");
  lines.push("Allocation:");
  for (const a of r.allocation) lines.push(`  - ${CATEGORY_LABEL[a.category]}: ${fmtKES(a.value)} (${fmtPct(a.pct)})`);
  lines.push("");
  lines.push("Goals:");
  for (const g of r.goalsProgress) lines.push(`  - ${g.name}: ${fmtPct(g.pct)}`);
  lines.push("");
  lines.push("Insights:");
  for (const i of r.insights) lines.push(`  • ${i}`);
  return lines.join("\n");
}

/* ---------- CSV export ---------- */

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV<T extends Record<string, unknown>>(rows: T[], headers?: string[]): string {
  if (rows.length === 0) return (headers ?? []).join(",");
  const cols = headers ?? Object.keys(rows[0]);
  const head = cols.map(csvCell).join(",");
  const body = rows.map((r) => cols.map((c) => csvCell((r as any)[c])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}