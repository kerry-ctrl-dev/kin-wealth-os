import type { Tables } from "@/integrations/supabase/types";

export type AssetCategory = "MMF" | "STOCKS" | "REITS" | "CASH" | "REAL_ESTATE";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type AlertSeverity = "INFO" | "WARNING" | "DANGER";

export type Asset = Tables<"assets">;
export type Income = Tables<"income">;
export type Goal = Tables<"goals">;

export const ALLOCATION: Record<"MMF" | "STOCKS" | "REITS", number> = {
  MMF: 0.4,
  STOCKS: 0.4,
  REITS: 0.2,
};

export const LIQUIDITY_SCORE: Record<AssetCategory, number> = {
  CASH: 5,
  MMF: 4,
  STOCKS: 3,
  REITS: 2,
  REAL_ESTATE: 1,
};

export const CATEGORY_LABEL: Record<AssetCategory, string> = {
  MMF: "Money Market Fund",
  STOCKS: "NSE Stocks",
  REITS: "REITs",
  CASH: "Cash",
  REAL_ESTATE: "Real Estate",
};

export const CATEGORY_COLOR: Record<AssetCategory, string> = {
  MMF: "var(--chart-1)",
  STOCKS: "var(--chart-2)",
  REITS: "var(--chart-3)",
  CASH: "var(--chart-4)",
  REAL_ESTATE: "var(--chart-5)",
};

export const DEFAULT_TICKERS: Record<"STOCKS" | "REITS" | "MMF", string> = {
  MMF: "CIC Money Market Fund",
  STOCKS: "NSE: SCOM / KCB / EQTY",
  REITS: "Acorn / Vuka REIT",
};

export interface AllocationRow {
  category: AssetCategory;
  name: string;
  value: number;
  liquidity: number;
}

export function allocateIncome(amount: number): AllocationRow[] {
  return [
    { category: "MMF", name: DEFAULT_TICKERS.MMF, value: +(amount * ALLOCATION.MMF).toFixed(2), liquidity: LIQUIDITY_SCORE.MMF },
    { category: "STOCKS", name: DEFAULT_TICKERS.STOCKS, value: +(amount * ALLOCATION.STOCKS).toFixed(2), liquidity: LIQUIDITY_SCORE.STOCKS },
    { category: "REITS", name: DEFAULT_TICKERS.REITS, value: +(amount * ALLOCATION.REITS).toFixed(2), liquidity: LIQUIDITY_SCORE.REITS },
  ];
}

export function totalValue(assets: Asset[]): number {
  return assets.reduce((s, a) => s + Number(a.value), 0);
}

export function totalIncome(income: Income[]): number {
  return income.reduce((s, i) => s + Number(i.amount), 0);
}

export function byCategory(assets: Asset[]): Record<AssetCategory, number> {
  const out: Record<AssetCategory, number> = { MMF: 0, STOCKS: 0, REITS: 0, CASH: 0, REAL_ESTATE: 0 };
  for (const a of assets) out[a.category as AssetCategory] += Number(a.value);
  return out;
}

export function allocationPercents(assets: Asset[]): Array<{ category: AssetCategory; value: number; pct: number }> {
  const total = totalValue(assets) || 1;
  const cats = byCategory(assets);
  return (Object.keys(cats) as AssetCategory[])
    .map((c) => ({ category: c, value: cats[c], pct: (cats[c] / total) * 100 }))
    .filter((r) => r.value > 0);
}

/** Liquidity ratio: weighted liquid value / total value. Liquid = CASH+MMF (score >= 4). */
export function liquidityRatio(assets: Asset[]): number {
  const total = totalValue(assets);
  if (!total) return 0;
  const liquid = assets
    .filter((a) => Number(a.liquidity) >= 4)
    .reduce((s, a) => s + Number(a.value), 0);
  return liquid / total;
}

/** ROI = (current_assets - total_income_invested) / total_income_invested * 100 */
export function computeRoi(assets: Asset[], income: Income[]): number {
  const invested = totalIncome(income);
  if (!invested) return 0;
  return ((totalValue(assets) - invested) / invested) * 100;
}

export function computeRisk(assets: Asset[]): RiskLevel {
  const total = totalValue(assets) || 1;
  const cats = byCategory(assets);
  const stocksPct = cats.STOCKS / total;
  const reitsPct = cats.REITS / total;
  const liq = liquidityRatio(assets);
  if (stocksPct > 0.6 || liq < 0.2) return "HIGH";
  if (stocksPct + reitsPct > 0.6 || liq < 0.4) return "MEDIUM";
  return "LOW";
}

export interface ComputedAlert {
  type: string;
  message: string;
  severity: AlertSeverity;
}

export function generateAlerts(assets: Asset[], income: Income[]): ComputedAlert[] {
  const out: ComputedAlert[] = [];
  const liq = liquidityRatio(assets);
  const roi = computeRoi(assets, income);
  const total = totalValue(assets) || 1;
  const stocksPct = byCategory(assets).STOCKS / total;

  if (assets.length === 0) return out;
  if (liq < 0.3) out.push({ type: "LIQUIDITY", severity: "DANGER", message: `Liquidity is critically low (${(liq * 100).toFixed(1)}%). Build a cash buffer.` });
  else if (liq < 0.5) out.push({ type: "LIQUIDITY", severity: "WARNING", message: `Liquidity below comfort zone (${(liq * 100).toFixed(1)}%).` });

  if (roi < 0) out.push({ type: "PERFORMANCE", severity: "WARNING", message: `Portfolio ROI is negative (${roi.toFixed(2)}%). Review allocation.` });
  if (stocksPct > 0.6) out.push({ type: "VOLATILITY", severity: "WARNING", message: `Stock exposure is ${(stocksPct * 100).toFixed(0)}% — high volatility risk.` });
  return out;
}

export function monthlyNeeded(goal: Goal): number {
  const target = Number(goal.target);
  const current = Number(goal.current);
  const remaining = target - current;
  if (remaining <= 0) return 0;
  if (!goal.deadline) return remaining / 12; // assume 12 months
  const months = Math.max(
    1,
    Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)),
  );
  return remaining / months;
}

export const fmtKES = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n || 0);

export const fmtPct = (n: number, digits = 1) => `${(n || 0).toFixed(digits)}%`;