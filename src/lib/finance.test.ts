import { describe, expect, it } from "vitest";
import {
  allocateIncome,
  allocationPercents,
  computeRisk,
  computeRoi,
  generateAlerts,
  liquidityRatio,
} from "./finance";

const asset = (overrides: Record<string, unknown> = {}) =>
  ({ category: "CASH", value: 0, liquidity: 5, ...overrides }) as never;
const income = (amount: number) => ({ amount }) as never;

describe("finance calculations", () => {
  it("allocates income according to the target mix", () => {
    expect(allocateIncome(1_000)).toMatchObject([
      { category: "MMF", value: 300, liquidity: 4 },
      { category: "STOCKS", value: 300, liquidity: 3 },
      { category: "REITS", value: 200, liquidity: 2 },
      { category: "CASH", value: 200, liquidity: 5 },
    ]);
  });

  it("calculates allocation percentages and liquidity", () => {
    const assets = [
      asset({ category: "CASH", value: 200, liquidity: 5 }),
      asset({ category: "STOCKS", value: 800, liquidity: 3 }),
    ];

    expect(allocationPercents(assets)).toEqual([
      { category: "STOCKS", value: 800, pct: 80 },
      { category: "CASH", value: 200, pct: 20 },
    ]);
    expect(liquidityRatio(assets)).toBe(0.2);
  });

  it("calculates ROI safely when no income has been invested", () => {
    expect(computeRoi([asset({ value: 1_200 })], [income(1_000)])).toBe(20);
    expect(computeRoi([asset({ value: 1_200 })], [])).toBe(0);
  });

  it("classifies concentrated, illiquid portfolios as high risk", () => {
    expect(
      computeRisk([
        asset({ category: "STOCKS", value: 700, liquidity: 3 }),
        asset({ category: "CASH", value: 300, liquidity: 5 }),
      ]),
    ).toBe("HIGH");
    expect(
      computeRisk([
        asset({ category: "MMF", value: 500, liquidity: 4 }),
        asset({ category: "CASH", value: 500, liquidity: 5 }),
      ]),
    ).toBe("LOW");
  });

  it("raises liquidity, performance, and concentration alerts", () => {
    const alerts = generateAlerts(
      [
        asset({ category: "STOCKS", value: 800, liquidity: 3 }),
        asset({ category: "REITS", value: 200, liquidity: 2 }),
      ],
      [income(1_200)],
    );

    expect(alerts.map((alert) => alert.type)).toEqual(["LIQUIDITY", "PERFORMANCE", "VOLATILITY"]);
    expect(alerts[0].severity).toBe("DANGER");
  });
});
