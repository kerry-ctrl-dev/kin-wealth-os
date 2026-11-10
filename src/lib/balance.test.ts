import { describe, expect, it, vi } from "vitest";
import {
  incomeBalances,
  loanOutstanding,
  netWorth,
  totalAvailableCash,
  totalLoansOutstanding,
  totalLoansReceivable,
} from "./balance";

const income = (id: string, amount: number) => ({ id, amount }) as never;
const asset = (value: number, source_income_id: string | null = null) =>
  ({ value, source_income_id }) as never;
const expense = (amount: number, source_income_id: string | null = null) =>
  ({ amount, source_income_id }) as never;
const loan = (overrides: Record<string, unknown> = {}) =>
  ({
    principal: 1_000,
    interest_rate: 12,
    interest_period: "YEARLY",
    borrowed_at: "2025-01-01T00:00:00.000Z",
    due_date: "2026-01-01T00:00:00.000Z",
    amount_repaid: 0,
    direction: "BORROWED",
    status: "ACTIVE",
    ...overrides,
  }) as never;

describe("balance calculations", () => {
  it("rolls investments and expenses into each income balance", () => {
    const balances = incomeBalances(
      [income("salary", 1_000)],
      [asset(300, "salary")],
      [expense(250, "salary")],
    );
    expect(balances.get("salary")).toEqual({ amount: 1_000, used: 550, remaining: 450 });
    expect(
      totalAvailableCash(
        [income("salary", 1_000)],
        [asset(300, "salary")],
        [expense(250, "salary")],
      ),
    ).toBe(450);
  });

  it("never counts overspent income as available cash", () => {
    expect(totalAvailableCash([income("salary", 100)], [asset(150, "salary")], [])).toBe(0);
  });

  it("calculates simple-interest loan balances and never drops below zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    expect(loanOutstanding(loan())).toBeCloseTo(1_000 * (1 + 0.12 * (365 / 365.25)), 5);
    expect(loanOutstanding(loan({ amount_repaid: 2_000 }))).toBe(0);
    vi.useRealTimers();
  });

  it("keeps borrowings and receivables separate in net worth", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    const loans = [
      loan({ principal: 500 }),
      loan({ principal: 300, direction: "LENT" }),
      loan({ principal: 900, status: "REPAID" }),
    ];
    expect(totalLoansOutstanding(loans)).toBe(500);
    expect(totalLoansReceivable(loans)).toBe(300);
    expect(netWorth([asset(1_000)], [{ value: 200 } as never], loans)).toBe(1_000);
    vi.useRealTimers();
  });
});
