import type { Tables } from "@/integrations/supabase/types";
import { totalIncome, totalValue, computeRoi, liquidityRatio, byCategory, computeRisk, CATEGORY_LABEL, fmtKES, fmtPct, type AssetCategory } from "./finance";

type Asset = Tables<"assets">;
type Income = Tables<"income">;
type Goal = Tables<"goals">;

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
}

export function buildReport(period: ReportPeriod, assets: Asset[], income: Income[], goals: Goal[], ref: Date = new Date()): Report {
  const { from, to, label } = periodRange(period, ref);
  const incomePeriod = inRange(income, "date", from, to);
  const assetsPeriod = inRange(assets, "created_at", from, to);
  const cats = byCategory(assets);
  const total = totalValue(assets);
  const allocation = (Object.keys(cats) as AssetCategory[])
    .filter((c) => cats[c] > 0)
    .map((c) => ({ category: c, value: cats[c], pct: total ? (cats[c] / total) * 100 : 0 }));
  const roi = computeRoi(assets, income);
  const liq = liquidityRatio(assets);
  const risk = computeRisk(assets);
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