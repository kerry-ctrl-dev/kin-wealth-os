import type { Tables } from "@/integrations/supabase/types";

type Income = Tables<"income">;
type Asset = Tables<"assets">;
type Expense = Tables<"expenses">;
type PersonalAsset = Tables<"personal_assets">;
type Loan = Tables<"loans">;

/** Per-income remaining cash after investments + expenses charged to it. */
export function incomeBalances(
  income: Income[],
  assets: Asset[],
  expenses: Expense[],
): Map<string, { amount: number; used: number; remaining: number }> {
  const out = new Map<string, { amount: number; used: number; remaining: number }>();
  for (const i of income) out.set(i.id, { amount: Number(i.amount), used: 0, remaining: Number(i.amount) });
  for (const a of assets) {
    if (!a.source_income_id) continue;
    const row = out.get(a.source_income_id);
    if (row) { row.used += Number(a.value); row.remaining = row.amount - row.used; }
  }
  for (const e of expenses) {
    if (!e.source_income_id) continue;
    const row = out.get(e.source_income_id);
    if (row) { row.used += Number(e.amount); row.remaining = row.amount - row.used; }
  }
  return out;
}

/** Total cash available across all income entries (sum of remaining). */
export function totalAvailableCash(
  income: Income[],
  assets: Asset[],
  expenses: Expense[],
): number {
  const map = incomeBalances(income, assets, expenses);
  let sum = 0;
  for (const v of map.values()) sum += Math.max(0, v.remaining);
  return sum;
}

/** Outstanding loan principal+interest minus repayments. Simple-interest approximation. */
export function loanOutstanding(l: Loan): number {
  const principal = Number(l.principal);
  const rate = Number(l.interest_rate || 0) / 100;
  const start = new Date(l.borrowed_at).getTime();
  const ref = Math.min(Date.now(), l.due_date ? new Date(l.due_date).getTime() : Date.now());
  const years = Math.max(0, (ref - start) / (365.25 * 86400_000));
  const accrued = principal * (1 + rate * years);
  return Math.max(0, accrued - Number(l.amount_repaid || 0));
}

export function totalLoansOutstanding(loans: Loan[]): number {
  return loans
    .filter((l) => l.status !== "REPAID" && (l.direction ?? "BORROWED") === "BORROWED")
    .reduce((s, l) => s + loanOutstanding(l), 0);
}

/** Money the user has lent out to others and not yet been repaid (receivable). */
export function totalLoansReceivable(loans: Loan[]): number {
  return loans
    .filter((l) => l.status !== "REPAID" && l.direction === "LENT")
    .reduce((s, l) => s + loanOutstanding(l), 0);
}

export function personalAssetsValue(items: PersonalAsset[]): number {
  return items.reduce((s, p) => s + Number(p.value), 0);
}

/** Net worth = investments + personal assets + receivables - outstanding debt. */
export function netWorth(
  assets: Asset[],
  personalAssets: PersonalAsset[],
  loans: Loan[],
): number {
  const inv = assets.reduce((s, a) => s + Number(a.value), 0);
  const pa = personalAssetsValue(personalAssets);
  const debt = totalLoansOutstanding(loans);
  const receivable = totalLoansReceivable(loans);
  return inv + pa + receivable - debt;
}